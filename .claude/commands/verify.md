---
description: Run the local quality gate (type check, unit tests, a11y lint) and report results
allowed-tools: Bash(pnpm run tsc:*), Bash(pnpm run test:unit:run:*), Bash(pnpm run lint:a11y:*), Bash(pnpm run verify:*)
---

Run the project's quality gate and report a concise pass/fail summary. This mirrors
what CI enforces so failures are caught before pushing.

Run these (stop and report the first hard failure with its output, otherwise run all three):

1. `pnpm run tsc` — vue-tsc type checking (catches mock-shape / prop-type errors)
2. `pnpm run test:unit:run` — Vitest unit suite
3. `pnpm run lint:a11y` — accessibility lint on components

Then report: which passed, which failed, and for any failure the specific file(s) and
error. Do not attempt fixes unless asked — just surface the state clearly.
