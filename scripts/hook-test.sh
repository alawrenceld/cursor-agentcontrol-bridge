#!/bin/sh
# Pipe each recorded sample payload through the hook script in DRY_RUN mode.
# Expected: pending-file stamp for beforeSubmitPrompt, DRY_RUN track lines for
# stop-completed/stop-error, silent skip for stop-aborted. Always exits 0.
set -e
cd "$(dirname "$0")/.."

# Force repo mode so a developer's ~/.cursor/ld-agentcontrol.json can't leak in.
export LD_AGENTCONTROL_CONFIG=repo

for fixture in beforeSubmitPrompt stop-completed stop-error stop-aborted; do
  echo "--- $fixture ---"
  DRY_RUN=1 node src/hooks/cursor-hook.mjs < "test/fixtures/$fixture.json"
  echo ""
done

if [ -f extension/hook/cursor-hook.js ]; then
  echo "--- bundled hook (stop-completed) ---"
  DRY_RUN=1 node extension/hook/cursor-hook.js < test/fixtures/stop-completed.json
  echo ""
fi

echo "--- .state/hook.log (tail) ---"
tail -n 8 .state/hook.log 2>/dev/null || true
