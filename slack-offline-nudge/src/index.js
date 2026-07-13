import { WebClient } from "@slack/web-api";
import { loadConfig } from "./config.js";
import { PresenceWatcher } from "./watcher.js";

async function main() {
  const config = loadConfig();
  const client = new WebClient(config.token);

  const auth = await client.auth.test();
  console.log(
    `[nudge] connected as ${auth.user} on ${auth.team} (bot=${auth.user_id})`,
  );

  const watcher = new PresenceWatcher(client, config);
  await watcher.start();
}

main().catch((err) => {
  console.error("[nudge] fatal:", err.data?.error ?? err.message ?? err);
  process.exit(1);
});
