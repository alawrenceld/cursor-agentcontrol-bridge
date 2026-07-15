---
name: agent-usage
description: Show Claude Code → LaunchDarkly agent usage (local Me ledger or All team Monitoring)
disable-model-invocation: true
allowed-tools: Bash(node *)
---

# Agent usage report

Run this command exactly. Show the full stdout to the user with no summarization.

```bash
node "${CLAUDE_SKILL_DIR}/run.mjs" $ARGUMENTS
```

## Arguments

Order does not matter. Combine a **scope** and optional **window**:

| Arg | Meaning |
|-----|---------|
| `local` (default) | Me — this machine’s Claude ledger, filtered to `hookUserEmail` |
| `all` | Team — LaunchDarkly AI Config Monitoring for `claude-code-usage` (needs `LD_API_TOKEN`) |
| `1h` / `24h` / `7d` / `30d` | Time window (`24h` default) |

Examples: `/agent-usage`, `/agent-usage local`, `/agent-usage all`, `/agent-usage all 7d`, `/agent-usage local 30d`.
