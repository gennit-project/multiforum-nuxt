import { ref, type Ref } from 'vue';
import { vi, type Mock } from 'vitest';

/**
 * Shared helpers for mocking `@vue/apollo-composable` in unit tests. These
 * codify the canonical return shapes used across the codebase so individual
 * specs don't re-invent them.
 *
 * Usage (module-level mock, then configure per test):
 *
 *   vi.mock('@vue/apollo-composable', () => ({
 *     useQuery: vi.fn(),
 *     useMutation: vi.fn(),
 *   }));
 *   import { useQuery } from '@vue/apollo-composable';
 *   asMock(useQuery).mockReturnValue(createQueryMock({ channels: [] }));
 */

/** Narrow a mocked import to a vitest Mock for `.mockReturnValue(...)` etc. */
export function asMock<T>(fn: T): Mock {
  return fn as unknown as Mock;
}

export type QueryMock<T = unknown> = {
  result: Ref<T>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  onResult: Mock;
  onError: Mock;
  refetch: Mock;
};

/**
 * Build a canonical `useQuery` return value with `result` pre-populated.
 * `onResult`/`onError` are no-op mocks unless overridden.
 */
export function createQueryMock<T = unknown>(
  result: T,
  overrides: Partial<QueryMock<T>> = {}
): QueryMock<T> {
  return {
    result: ref(result) as Ref<T>,
    loading: ref(false),
    error: ref<Error | null>(null),
    onResult: vi.fn(),
    onError: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  };
}

export type MutationMock = {
  mutate: Mock<(...args: unknown[]) => unknown>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  onDone: Mock;
  onError: Mock;
};

/**
 * Build a canonical `useMutation` return value. Pass a custom `mutate` to
 * assert on calls or resolve specific data.
 */
export function createMutationMock(
  overrides: Partial<MutationMock> = {}
): MutationMock {
  return {
    mutate: vi.fn<(...args: unknown[]) => unknown>(),
    loading: ref(false),
    error: ref<Error | null>(null),
    onDone: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
}

/**
 * Create a `useMutation`/`useQuery` implementation that returns a different
 * mock depending on which GraphQL document was passed, matched by a substring
 * of the document's source body. Falls back to `fallback` when nothing matches.
 *
 *   useMutation: mockByDocument({
 *     RemoveServerAdmin: createMutationMock({ mutate: removeAdmin }),
 *   }, createMutationMock()),
 */
export function mockByDocument<T>(
  matchers: Record<string, T>,
  fallback: T
): (doc: unknown) => T {
  return (doc: unknown) => {
    const source =
      (doc as { loc?: { source?: { body?: string } } })?.loc?.source?.body ??
      String(doc);
    for (const [needle, value] of Object.entries(matchers)) {
      if (source.includes(needle)) {
        return value;
      }
    }
    return fallback;
  };
}

/**
 * Wire a component's mocked `useQuery`/`useMutation` in one call, dispatching by
 * GraphQL document substring. This collapses the per-spec boilerplate of
 * `asMock(useQuery).mockImplementation(mockByDocument({...}, createQueryMock({})))`.
 *
 * Pass the *mocked imports* (from a `vi.mock('@vue/apollo-composable', ...)`
 * block) plus name→mock maps. Query values are full `QueryMock`s (build with
 * `createQueryMock`); mutation values are `MutationMock`s.
 *
 *   vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn(), useMutation: vi.fn() }));
 *   import { useQuery, useMutation } from '@vue/apollo-composable';
 *   configureApolloMocks({
 *     useQuery, useMutation,
 *     queries: { getEvent: createQueryMock({ events: [event] }) },
 *     mutations: { DeleteEvent: createMutationMock() },
 *   });
 */
export function configureApolloMocks(params: {
  useQuery?: unknown;
  useMutation?: unknown;
  queries?: Record<string, QueryMock>;
  mutations?: Record<string, MutationMock>;
  fallbackQuery?: QueryMock;
  fallbackMutation?: MutationMock;
}): void {
  const {
    useQuery,
    useMutation,
    queries = {},
    mutations = {},
    fallbackQuery = createQueryMock({}),
    fallbackMutation = createMutationMock(),
  } = params;

  if (useQuery) {
    asMock(useQuery).mockImplementation(mockByDocument(queries, fallbackQuery));
  }
  if (useMutation) {
    asMock(useMutation).mockImplementation(
      mockByDocument(mutations, fallbackMutation)
    );
  }
}

/**
 * A per-operation mutation mock that also captures the two callbacks a component
 * registers with `useMutation` — the `update` cache function passed in the
 * options, and the `onDone` handlers — so a spec can invoke that logic directly
 * (drive `submit()`, fire the mutation's `onDone`, run its cache updater against
 * a fake cache) instead of standing up a real Apollo client.
 */
export type MutationTracker = {
  mutate: Mock<(...args: unknown[]) => unknown>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  onDone: Mock;
  onError: Mock;
  /** The `update` fn the component passed as `options.update` (null if none). */
  update: ((cache: unknown, result?: unknown) => void) | null;
  /** Invoke every `onDone` callback the component registered. */
  fireDone: () => void;
};

export type MutationRouter = {
  /** Drop-in `useMutation` implementation (routes by gql operation name). */
  useMutation: (doc: unknown, options?: unknown) => MutationTracker;
  /** Get (creating if needed) the tracker for an operation name. */
  get: (name: string) => MutationTracker;
  /** Forget all trackers — call in `beforeEach`. */
  reset: () => void;
};

/**
 * Route each `useMutation(<gql>, <options>)` call to a per-operation
 * {@link MutationTracker}, matched on the operation name appearing in the gql
 * source body. Longer names are matched first, so `undoSuperUpvote` wins over a
 * bare `upvote` substring.
 *
 *   vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn(), useQuery: vi.fn() }));
 *   import { useMutation } from '@vue/apollo-composable';
 *   const router = createMutationRouter(['subscribeToEvent', 'unsubscribeFromEvent']);
 *   beforeEach(() => { router.reset(); asMock(useMutation).mockImplementation(router.useMutation); });
 *   // ...mount, then:
 *   router.get('subscribeToEvent').fireDone();
 *   router.get('subscribeToEvent').update!(fakeCache, { data });
 */
export function createMutationRouter(names: string[]): MutationRouter {
  const byLongestName = [...names].sort((a, b) => b.length - a.length);
  const trackers = new Map<string, MutationTracker>();

  const detect = (src: string) =>
    byLongestName.find((n) => src.includes(n)) ?? 'unknown';

  const get = (name: string): MutationTracker => {
    if (!trackers.has(name)) {
      const doneCbs: Array<() => void> = [];
      trackers.set(name, {
        mutate: vi.fn<(...args: unknown[]) => unknown>(),
        loading: ref(false),
        error: ref<Error | null>(null),
        onDone: vi.fn((cb: () => void) => {
          doneCbs.push(cb);
        }),
        onError: vi.fn(),
        update: null,
        fireDone: () => doneCbs.forEach((cb) => cb()),
      });
    }
    return trackers.get(name)!;
  };

  const useMutation = (doc: unknown, options?: unknown): MutationTracker => {
    const src =
      (doc as { loc?: { source?: { body?: string } } })?.loc?.source?.body ??
      String(doc);
    const tracker = get(detect(src));
    // Options may be a plain object or a function returning reactive options.
    let resolved: unknown = options;
    if (typeof options === 'function') {
      try {
        resolved = (options as () => unknown)();
      } catch {
        resolved = undefined;
      }
    }
    const update = (resolved as { update?: MutationTracker['update'] })?.update;
    if (update) tracker.update = update;
    return tracker;
  };

  return { useMutation, get, reset: () => trackers.clear() };
}
