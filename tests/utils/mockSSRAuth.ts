import { computed, ref } from 'vue';
import { vi } from 'vitest';

/**
 * Helper for mocking `@/composables/useSSRAuth` in unit tests.
 *
 * The real composable calls `useCookie` from `nuxt/app` at module load, which
 * pulls the full Nuxt runtime and crashes under Vitest. Any component that
 * imports it (directly, or via `RequireAuth`) therefore needs it mocked — even
 * when `RequireAuth` itself is stubbed by mountWithDefaults, because the import
 * still executes.
 *
 * The factory form keeps the vi.mock body self-contained (hoisting-safe):
 *
 *   vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());
 *   vi.mock('@/composables/useSSRAuth', () =>
 *     createSSRAuthMock({ hasAuthHint: true, usernameHint: 'alice' }));
 *
 * The setters are vi.fn spies and also update the returned reactive hints, so a
 * test can assert calls and observe state changes.
 */
export type SSRAuthState = {
  hasAuthHint?: boolean;
  usernameHint?: string;
};

export function createSSRAuthMock(state: SSRAuthState = {}) {
  const authHint = ref(state.hasAuthHint ?? false);
  const usernameHint = ref(state.usernameHint ?? '');
  return {
    useSSRAuth: () => ({
      hasAuthHint: computed(() => authHint.value),
      usernameHint: computed(() => usernameHint.value),
      setAuthHint: vi.fn((value: boolean) => {
        authHint.value = value;
      }),
      setUsernameHint: vi.fn((username: string | null) => {
        usernameHint.value = username ?? '';
      }),
      clearAuthHints: vi.fn(() => {
        authHint.value = false;
        usernameHint.value = '';
      }),
    }),
  };
}
