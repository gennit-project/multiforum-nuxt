import { vi, type Mock } from 'vitest';

/**
 * Shared helpers for mocking `nuxt/app` routing in unit tests, modeled on the
 * stable object pattern in useFilterBar.spec.ts.
 *
 * Usage:
 *
 *   const route = createMockRoute({ params: { forumId: 'cats' } });
 *   const router = createMockRouter();
 *   vi.mock('nuxt/app', () => ({
 *     useRoute: () => route,
 *     useRouter: () => router,
 *   }));
 */

export type MockRoute = {
  params: Record<string, string>;
  query: Record<string, unknown>;
  name: string;
  path: string;
  fullPath: string;
};

export function createMockRoute(
  overrides: Partial<MockRoute> = {}
): MockRoute {
  return {
    params: {},
    query: {},
    name: 'test-route',
    path: '/test',
    fullPath: '/test',
    ...overrides,
  };
}

export type MockRouter = {
  push: Mock;
  replace: Mock;
  go: Mock;
  back: Mock;
};

export function createMockRouter(
  overrides: Partial<MockRouter> = {}
): MockRouter {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    ...overrides,
  };
}
