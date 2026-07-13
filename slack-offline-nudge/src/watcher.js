/**
 * Polls Slack presence and DMs users the moment they flip active → away.
 *
 * Modern Slack apps cannot subscribe to presence_change (RTM-only / legacy).
 * Polling users.getPresence is the supported approach.
 */
export class PresenceWatcher {
  /** @param {import("@slack/web-api").WebClient} client */
  constructor(client, config) {
    this.client = client;
    this.config = config;
    /** @type {Map<string, "active" | "away">} */
    this.lastPresence = new Map();
    /** @type {Map<string, number>} last nudge timestamp per user */
    this.lastNudgeAt = new Map();
    /** @type {string[]} */
    this.userIds = [];
    this.botUserId = null;
    this.timer = null;
    this.tickInFlight = false;
  }

  async start() {
    const auth = await this.client.auth.test();
    this.botUserId = auth.user_id;

    this.userIds = await this.resolveWatchList();
    if (this.userIds.length === 0) {
      throw new Error(
        "No users to watch. Set WATCH_USER_IDS or ensure the workspace has human members.",
      );
    }

    console.log(
      `[nudge] watching ${this.userIds.length} user(s); poll every ${this.config.pollIntervalMs}ms` +
        (this.config.dryRun ? " (DRY_RUN)" : ""),
    );

    // Seed baseline so we only nudge on transitions, not on first away sighting
    await this.seedPresence();

    const tick = async () => {
      if (this.tickInFlight) return;
      this.tickInFlight = true;
      try {
        await this.pollOnce();
      } catch (err) {
        console.error(
          "[nudge] poll error:",
          err.data?.error ?? err.message ?? err,
        );
      } finally {
        this.tickInFlight = false;
      }
    };

    this.timer = setInterval(tick, this.config.pollIntervalMs);
    // Unref so Ctrl+C / process exit isn't blocked; still keep process alive via interval
    if (typeof this.timer.unref === "function") {
      // keep process alive intentionally — do not unref
    }

    const shutdown = () => {
      console.log("[nudge] shutting down");
      if (this.timer) clearInterval(this.timer);
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  async resolveWatchList() {
    if (this.config.watchUserIds.length > 0) {
      return this.config.watchUserIds.filter((id) => id !== this.botUserId);
    }

    /** @type {string[]} */
    const ids = [];
    let cursor;
    do {
      const res = await this.client.users.list({
        limit: 200,
        cursor,
      });
      for (const u of res.members ?? []) {
        if (!u.id || u.id === this.botUserId) continue;
        if (u.is_bot || u.is_app_user || u.deleted) continue;
        if (u.id === "USLACKBOT") continue;
        ids.push(u.id);
      }
      cursor = res.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return ids;
  }

  async seedPresence() {
    for (const userId of this.userIds) {
      try {
        const presence = await this.fetchPresence(userId);
        this.lastPresence.set(userId, presence);
        console.log(`[nudge] seed ${userId} → ${presence}`);
      } catch (err) {
        console.warn(
          `[nudge] could not seed ${userId}:`,
          err.data?.error ?? err.message,
        );
      }
      await sleep(200);
    }
  }

  async pollOnce() {
    for (const userId of this.userIds) {
      let presence;
      try {
        presence = await this.fetchPresence(userId);
      } catch (err) {
        const code = err.data?.error;
        if (code === "ratelimited") {
          const retry = Number(err.data?.retry_after ?? 5);
          console.warn(`[nudge] rate limited; backing off ${retry}s`);
          await sleep(retry * 1000);
          return;
        }
        console.warn(
          `[nudge] getPresence failed for ${userId}:`,
          code ?? err.message,
        );
        continue;
      }

      const prev = this.lastPresence.get(userId);
      this.lastPresence.set(userId, presence);

      if (prev === "active" && presence === "away") {
        await this.nudge(userId);
      }

      await sleep(150);
    }
  }

  /** @returns {Promise<"active" | "away">} */
  async fetchPresence(userId) {
    const res = await this.client.users.getPresence({ user: userId });
    const presence = res.presence === "active" ? "active" : "away";
    return presence;
  }

  async nudge(userId) {
    const now = Date.now();
    const last = this.lastNudgeAt.get(userId) ?? 0;
    if (now - last < this.config.nudgeCooldownMs) {
      console.log(
        `[nudge] skip ${userId} (cooldown ${Math.ceil((this.config.nudgeCooldownMs - (now - last)) / 1000)}s left)`,
      );
      return;
    }

    console.log(
      `[nudge] ${userId} went inactive → ${this.config.dryRun ? "would send" : "sending"} "${this.config.nudgeMessage}"`,
    );

    if (this.config.dryRun) {
      this.lastNudgeAt.set(userId, now);
      return;
    }

    try {
      const dm = await this.client.conversations.open({ users: userId });
      const channel = dm.channel?.id;
      if (!channel) {
        throw new Error("conversations.open returned no channel");
      }
      await this.client.chat.postMessage({
        channel,
        text: this.config.nudgeMessage,
      });
      this.lastNudgeAt.set(userId, now);
    } catch (err) {
      console.error(
        `[nudge] failed to DM ${userId}:`,
        err.data?.error ?? err.message,
      );
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
