import { ref } from 'vue';

/**
 * Helper for mocking the `@/cache` reactive auth vars in unit tests.
 *
 * `@/cache` exposes module-level `ref`s (usernameVar, isAuthenticatedVar, …).
 * Components read `someVar.value`, so a mock just needs objects with a `value`.
 *
 * Usage (the factory keeps the vi.mock body self-contained, which avoids
 * vitest's hoisting pitfalls):
 *
 *   vi.mock('@/cache', () => createCacheMock({ username: 'alice' }));
 *
 * For an authenticated user, pass `username` (authenticated defaults to true
 * whenever a username is supplied). Returned vars are real refs, so a test
 * can also mutate them mid-run via the object it passed to vi.mock.
 */
export type AuthState = {
  username?: string;
  authenticated?: boolean;
  modProfileName?: string;
  profilePicURL?: string;
  notificationCount?: number;
  isLoadingAuth?: boolean;
};

export function createCacheMock(state: AuthState = {}) {
  const username = state.username ?? '';
  const authenticated = state.authenticated ?? username !== '';
  return {
    usernameVar: ref(username),
    isAuthenticatedVar: ref(authenticated),
    modProfileNameVar: ref(state.modProfileName ?? ''),
    profilePicURLVar: ref(state.profilePicURL ?? ''),
    notificationCountVar: ref(state.notificationCount ?? 0),
    isLoadingAuthVar: ref(state.isLoadingAuth ?? false),
    userDataLoadingVar: ref(false),
    sideNavIsOpenVar: ref(false),
    setSideNavIsOpenVar: (status: boolean) => status,
    enteredDevelopmentEnvironmentVar: ref(false),
  };
}

/** Convenience preset for the most common case: a logged-in user. */
export function createAuthenticatedCacheMock(username = 'testuser') {
  return createCacheMock({ username, authenticated: true });
}
