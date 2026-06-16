# Unit test helpers (`tests/utils/`)

Shared utilities that remove the repeated boilerplate from Vitest specs. Import
them via the `@/tests/utils/...` alias.

| Helper | Use it to… |
|---|---|
| `factories.ts` | build typed fixtures for core GraphQL entities |
| `mockApollo.ts` | mock `@vue/apollo-composable` queries/mutations |
| `mockRouter.ts` | mock `nuxt/app` `useRoute` / `useRouter` |
| `mockAuth.ts` | mock the `@/cache` reactive auth vars |
| `mockSSRAuth.ts` | mock `@/composables/useSSRAuth` (needed for auth-gated components) |
| `mountWithDefaults.ts` | mount a component with Pinia + stubs + `$t` preset |

## Fixtures — `factories.ts`

Each factory fills the common scalar fields (and a few frequently-iterated
relations) with sane defaults and accepts partial overrides:

```ts
import { makeChannel, makeEvent, makeUser } from '@/tests/utils/factories';

const channel = makeChannel({ uniqueName: 'cats' });
const events = [makeEvent({ id: '1' }), makeEvent({ id: '2', title: 'Trivia' })];
```

Available: `makeUser`, `makeChannel`, `makeDiscussion`, `makeEvent`,
`makeComment`, plus `MOCK_DATE`. If a component reads a relation a factory
doesn't default, pass it via overrides.

## Apollo — `mockApollo.ts`

Mock the module once, then configure per test. `createQueryMock` /
`createMutationMock` return the canonical shapes; `mockByDocument` routes to a
different mock per GraphQL document.

```ts
import { useQuery } from '@vue/apollo-composable';
import { asMock, createQueryMock } from '@/tests/utils/mockApollo';

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

asMock(useQuery).mockReturnValue(createQueryMock({ channels: [makeChannel()] }));
```

For ordered multi-query components, chain `.mockReturnValueOnce(...)`. For
mutations keyed by document, use `mockByDocument({ ReportDiscussion: createMutationMock({ mutate }) }, createMutationMock())`.

## Router — `mockRouter.ts`

```ts
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';

const route = createMockRoute({ params: { forumId: 'cats' } });
const router = createMockRouter();
vi.mock('nuxt/app', () => ({ useRoute: () => route, useRouter: () => router }));

// later: expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ path: '/discussions' }))
```

## Auth — `mockAuth.ts`

`createCacheMock` returns an object shaped like `@/cache` (reactive `ref`s).
Pass it straight to `vi.mock` — the factory form is hoisting-safe.

```ts
import { createCacheMock } from '@/tests/utils/mockAuth';

vi.mock('@/cache', () => createCacheMock({ username: 'alice' })); // authenticated
vi.mock('@/cache', () => createCacheMock());                      // logged out
```

## SSR auth — `mockSSRAuth.ts`

Any component that imports `RequireAuth` (directly or transitively) needs this,
even when `RequireAuth` is stubbed: the import still runs, and `useSSRAuth`
calls `useCookie` from `nuxt/app`, which crashes under Vitest.

```ts
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());
// or seed the hints:
vi.mock('@/composables/useSSRAuth', () =>
  createSSRAuthMock({ hasAuthHint: true, usernameHint: 'alice' }));
```

## Mounting — `mountWithDefaults.ts`

A `mount` wrapper that injects a Testing Pinia (unless you pass your own
`global.plugins`), the `$t` mock, and `NuxtLayout` / `RequireAuth` stubs.
Per-call `stubs`/`mocks` merge on top of the defaults.

```ts
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const wrapper = mountWithDefaults(EventListItem, {
  props: { event: makeEvent(), currentChannelId: 'cats', showMap: false },
  global: { stubs: { Tag: true, ChevronDownIcon: true } },
});
```

Apollo is **not** wired by the harness — mock it at module level with
`mockApollo` (a mount option can't replace a module).

## Putting it together

See `components/event/list/EventListItem.spec.ts` for factory + router +
harness, and `components/channel/SearchableForumList.spec.ts` for
factory-free data + `mockApollo` + `mockAuth`.

## Where specs live

- Pure utils → `tests/unit/utils/*.spec.ts`
- Composables → co-located `composables/*.spec.ts`
- Components → co-located `components/**/*.spec.ts`
- One `expect` per `it`; prefer `it.each` for tables.
