import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal .env loader (no dependency). Does not override existing process.env.
 */
export function loadDotEnv(filename = ".env") {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return n;
}

export function loadConfig() {
  loadDotEnv();

  const token = required("SLACK_BOT_TOKEN");
  if (!token.startsWith("xoxb-") && !token.startsWith("xoxp-")) {
    console.warn(
      "[nudge] SLACK_BOT_TOKEN does not look like a Slack token (expected xoxb-…)",
    );
  }

  const watchRaw = process.env.WATCH_USER_IDS?.trim() ?? "";
  const watchUserIds = watchRaw
    ? watchRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    token,
    watchUserIds,
    pollIntervalMs: intEnv("POLL_INTERVAL_MS", 20_000),
    nudgeCooldownMs: intEnv("NUDGE_COOLDOWN_MS", 30 * 60 * 1000),
    nudgeMessage: process.env.NUDGE_MESSAGE?.trim() || "any updates?",
    dryRun: process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true",
  };
}
