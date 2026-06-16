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
