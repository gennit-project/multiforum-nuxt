import { ref } from 'vue';

/**
 * Helper for mocking the `@/composables/useAuthState` request-scoped auth state
 * in unit tests.
 *
 * `@/composables/useAuthState` exposes composables that each return a Vue `Ref`
 * (useUsername, useIsAuthenticated, …) plus imperative setters. Components read
 * `useUsername().value`, so a mock just needs composables that return objects
 * with a `value`.
 *
 * Usage (the factory keeps the vi.mock body self-contained, which avoids
 * vitest's hoisting pitfalls):
 *
 *   vi.mock('@/composables/useAuthState', () =>
 *     createAuthStateMock({ username: 'alice' })
 *   );
 *
 * For an authenticated user, pass `username` (authenticated defaults to true
 * whenever a username is supplied). The returned composables close over real
 * refs, so a test can also mutate them mid-run via the setters.
 */
export type AuthState = {
  username?: string;
  authenticated?: boolean;
  modProfileName?: string;
  email?: string;
  profilePicURL?: string;
  notificationCount?: number;
};

export function createAuthStateMock(state: AuthState = {}) {
  const username = state.username ?? '';
  const authenticated = state.authenticated ?? username !== '';

  const usernameRef = ref(username);
  const isAuthenticatedRef = ref(authenticated);
  const modProfileNameRef = ref(state.modProfileName ?? '');
  const emailRef = ref(state.email ?? '');
  const profilePicURLRef = ref(state.profilePicURL ?? '');
  const notificationCountRef = ref(state.notificationCount ?? 0);

  return {
    useUsername: () => usernameRef,
    useIsAuthenticated: () => isAuthenticatedRef,
    useModProfileName: () => modProfileNameRef,
    useEmail: () => emailRef,
    useProfilePicURL: () => profilePicURLRef,
    useNotificationCount: () => notificationCountRef,
    setUsername: (value: string) => {
      usernameRef.value = value;
    },
    setIsAuthenticated: (value: boolean) => {
      isAuthenticatedRef.value = value;
    },
    setModProfileName: (value: string) => {
      modProfileNameRef.value = value;
    },
    setEmail: (value: string) => {
      emailRef.value = value;
    },
    setProfilePicURL: (value: string) => {
      profilePicURLRef.value = value;
    },
    setNotificationCount: (value: number) => {
      notificationCountRef.value = value;
    },
  };
}

/** Convenience preset for the most common case: a logged-in user. */
export function createAuthenticatedAuthStateMock(username = 'testuser') {
  return createAuthStateMock({ username, authenticated: true });
}
