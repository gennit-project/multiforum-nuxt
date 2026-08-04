---
name: write-unit-test
description: Write or fix a Vitest unit test for this repo (components/*.spec.ts, foo.ts→foo.spec.ts, tests/unit). Use whenever adding, editing, or debugging a Vitest spec, mounting a Vue component under test, mocking Apollo/GraphQL, or resolving a vue-tsc failure in a spec. Encodes the project's hard-won testing gotchas.
---

# Writing a Vitest unit test (Multiforum)

Follow these project rules. They are enforced in review and several exist because a
real spec was rewritten after breaking them.

## Run
- All: `pnpm run test:unit`
- One file: `pnpm run test:unit -- --run tests/unit/path/to/test.spec.ts`
- Type check (CI gate that catches mock-shape bugs local runs miss): `pnpm run tsc`

## Structure
- **Colocate**: `Foo.vue` → `Foo.spec.ts`, `foo.ts` → `foo.spec.ts`. `tests/unit/**` is also picked up.
- **One `expect` per `it`.** Split into multiple `it` blocks, or combine into one
  structured `expect`. Use `it.each(...)` tables to stay DRY.

## The non-negotiable rules (each has burned someone)

1. **Mount the REAL component — never a hand-written stand-in.** A spec that defines
   `const FooTest = { template: '...' }` and mounts *that* adds **zero** coverage to
   `Foo.vue` and silently drifts. If a component is hard to mount, mock its
   dependencies (rule 3) — do not reimplement it. `CommentSection.spec.ts` was
   rewritten for exactly this.

2. **Test real logic, not reimplementations.** When a component holds non-trivial
   formatting/validation/derivation, extract it to a `utils/` function and unit-test
   that function directly (this is how `CreateEditEventFields`, `IssueDetail`,
   `CommentSection`, `Comment` are tested).

3. **Mock Apollo at the MODULE top level.** `mountWithDefaults` does not wire Apollo.
   Keep `vi.mock` at file top (Vitest hoists it — calling it inside `beforeEach`/
   `describe` is deprecated). To exercise a mutation's `onDone`, make `mutate()`
   synchronously fire the registered `onDone` callbacks; return an empty `useQuery`:
   ```typescript
   vi.mock('@vue/apollo-composable', async () => {
     const { ref } = await import('vue');
     return {
       useMutation: () => {
         const done: Array<(p: unknown) => void> = [];
         return {
           mutate: vi.fn(() => { done.forEach((cb) => cb({ data: {} })); }),
           onDone: (cb: (p: unknown) => void) => done.push(cb),
           onError: vi.fn(), loading: ref(false), error: ref(null),
         };
       },
       useQuery: () => ({ result: ref(null), loading: ref(false), error: ref(null), onResult: vi.fn(), onError: vi.fn() }),
     };
   });
   ```

4. **Seed hoisted `vi.fn` mocks with the FULL return shape.** `vi.fn(() => ({ valid: true }))`
   narrows the type, so a later `mockReturnValue({ valid: false, message })` fails CI's
   `vue-tsc` (TS2353) even when the test passes locally. Seed `{ valid: true, message: '' }`.
   If the mock factory references a local variable, prefix its name with `mock`.

5. **`@/utils` and `@/utils/index` are the same module.** If you `vi.mock` one, mock
   both, with every export the code under test imports — otherwise the second mock
   silently drops exports.

6. **Teleported UI renders into `document.body`.** `<Teleport to="body">` tooltips/
   modals are outside the wrapper subtree — assert with `document.body.querySelector(...)`.

7. **Mocked GraphQL entities need `__typename`.** Apollo normalizes by `__typename` +
   key field; without it the component receives only the key field (e.g. a channel
   arrives with just `uniqueName`).

## Thin page wrappers
Most pages are thin. Test via `shallowMount` + `findComponent(Child).props(...)`:
```typescript
const search = shallowMount(DiscussionsIndexPage, {
  global: { stubs: { NuxtLayout: SlotRenderingStub } },
}).findComponent(SearchDiscussions);
expect(search.props('isForumScoped')).toBe(false);
```
- Stub slot wrappers (`NuxtLayout`, `FormRow`) with a component that renders the slot.
- For pages calling `definePageMeta`, add `vi.stubGlobal('definePageMeta', vi.fn())`.

## Types
Import real GraphQL types from `@/__generated__/graphql` (`User`, `Comment`,
`Discussion`, `Event`, `TextVersion`, …). Avoid `any`. Fill all required nested
connection fields when building type-complete fixtures.

## Before finishing
Run the specific spec, then `pnpm run tsc`. Both must pass.
See [CONTRIBUTING.md](../../../CONTRIBUTING.md#frontend-testing-patterns) for the source of these rules.
