---
description: Verify, commit, push, and open a PR with a Conventional-Commit title that passes CI
argument-hint: "[optional: short description of the change]"
allowed-tools: Bash(pnpm run tsc:*), Bash(pnpm run test:unit:run:*), Bash(pnpm run lint:a11y:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git checkout:*), Bash(git push:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(gh pr create:*), Bash(gh pr view:*)
---

Ship the current change. Extra context from the user: $ARGUMENTS

Do these steps in order, stopping to report if any step fails:

1. **Verify.** Run `pnpm run tsc`, `pnpm run test:unit:run`, and `pnpm run lint:a11y`.
   If any fail, stop and report — do not commit broken code.

2. **Branch.** Run `git rev-parse --abbrev-ref HEAD`. If on `main`, create a feature
   branch first (never commit directly to `main`). Otherwise stay on the current branch.

3. **Commit.** Stage the relevant changes and commit. End the commit message with:
   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

4. **Push** the branch to the remote.

5. **Open a PR** with `gh pr create` against `main`. The **PR title is CI-gated** — the
   repo squash-merges and validates the title as a Conventional Commit
   (`.github/workflows/pr-title-lint.yml`). The title MUST:
   - use one of these types: `feat fix docs style refactor perf test build ci chore revert`
   - use an optional lower-case/kebab-case scope, e.g. `feat(moderation): ...`
   - have a subject that does **not** start with an upper-case letter
     (`fix(markdown): keep table cell words whole`, not `Fix Table`)
   End the PR body with:
   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

6. Report the PR URL.

Only commit and push when the user has asked to ship. If the working tree has unrelated
changes, ask before staging everything.
