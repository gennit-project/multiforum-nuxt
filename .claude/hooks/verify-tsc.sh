#!/usr/bin/env bash
# Stop hook: background type-check. Runs vue-tsc only when .ts/.vue files changed
# this session. On failure it exits 2 (asyncRewake) so Claude is re-engaged with the
# errors instead of the user discovering them later. Silent on success / no changes.
#
# Personal opt-in — wired from .claude/settings.local.json. Delete that hook entry
# (or this file) to turn it off.

INPUT=$(cat)

# Avoid Stop-hook loops: if this run was itself triggered by a Stop hook, bail.
if printf '%s' "$INPUT" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  exit 0
fi

# Only bother when TypeScript/Vue source actually changed vs HEAD.
CHANGED=$(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null | grep -E '\.(ts|vue)$')
if [ -z "$CHANGED" ]; then
  exit 0
fi

OUT=$(pnpm run tsc 2>&1)
if [ $? -eq 0 ]; then
  exit 0
fi

echo "vue-tsc found type errors (fix before finishing):"
printf '%s\n' "$OUT" | grep -E 'error TS' | head -40
exit 2
