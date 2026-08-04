# Code Review Checklist

A focused checklist for reviewing pull requests, with emphasis on defects that
AI-generated PRs in this repo have repeatedly introduced. Use it during human review
and when running `/code-review`. It complements — does not replace — CI (lint, tsc,
unit, Playwright, a11y).

## Apollo / GraphQL data

- [ ] **Hook state, not shadow refs.** Components use `useQuery`/`useMutation`'s own
  `loading`, `error`, `result`, `onResult`, `onDone`, `onError`. Reject hand-written
  `const loading = ref(false)` / `const errorMessage = ref('')` that duplicate what the
  hook already provides. (See the `apollo-data` skill.)
- [ ] **Side effects live in `onDone` / `onResult` / `onError`,** not in ad-hoc `.then()`
  chains or manually-awaited `mutate()` wrapped in try/catch that re-implements error state.
- [ ] **UI binds directly to the hook's `loading`/`error`** (disabled/spinner/error banner),
  rather than a mirrored local variable that can drift out of sync.

## Types

- [ ] **No `any` in application source.** It's an eslint error now; any new `any` should be
  a genuine untyped third-party interop case with a targeted
  `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + reason. GraphQL data
  is never a valid reason.
- [ ] **Generated types for inputs and responses.** Query variables and mutation inputs are
  typed with the generated `…QueryVariables` / `…MutationVariables` / `…Input` types from
  `@/__generated__/graphql`; response data uses the generated entity types.
- [ ] **Subsets use `Pick`/`Omit` on generated types,** not hand-written partial interfaces
  or widening to `any`.

## Tests (established repo pitfalls)

- [ ] **Real component mounted, not a hand-written stand-in.** No
  `const FooTest = { template: '...' }` masquerading as coverage. (See `write-unit-test`.)
- [ ] **Apollo mocked at module level**; mutation `onDone` exercised via a synchronous
  `mutate()`; `useQuery` mock returns the full shape.
- [ ] **Mocked GraphQL entities include `__typename`** (unit mocks and Playwright fixtures).
- [ ] **One `expect` per `it`.**

## Accessibility

- [ ] Interactive elements are native (`<button>`/`<NuxtLink>`), not clickable `<div>`s;
  inputs have accessible names; dynamic regions announce. (See the `accessibility` skill;
  `lint:a11y` + axe are the automated backstops.)
