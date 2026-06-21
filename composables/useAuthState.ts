// composables/useAuthState.ts
//
// Request-scoped auth state for the server-session migration.
//
// These replace the module-level `ref()`s that used to live in cache.ts
// (isAuthenticatedVar, usernameVar, modProfileNameVar, emailVar,
// profilePicURLVar, notificationCountVar). Module-level refs are SHARED across
// every request on a server instance — the classic Nuxt "cross-request state
// pollution" anti-pattern. Because the auth-session plugin seeds them per
// request, one user's auth state could bleed into another user's SSR render on
// the serverless runtime (concurrent requests, reused instances): a privacy
// leak (one user's authenticated UI served to another) AND a hydration mismatch
// (the leaked SSR state never matches the visitor's own client payload).
//
// `useState` is keyed to the CURRENT request's Nuxt app, so concurrent requests
// never share auth state. It also serializes into the Nuxt payload on the
// server and restores automatically on the client — so the auth-session plugin
// only has to seed on the server; the client picks the values back up with no
// re-seeding (and no mismatch).
//
// Consumers read these exactly like the old refs:
//   const isAuthenticatedVar = useIsAuthenticated();
//   ... isAuthenticatedVar.value ...
import { useState } from 'nuxt/app';

export const useIsAuthenticated = () =>
  useState<boolean>('auth:isAuthenticated', () => false);
export const useUsername = () => useState<string>('auth:username', () => '');
export const useEmail = () => useState<string>('auth:email', () => '');
export const useProfilePicURL = () =>
  useState<string>('auth:profilePicURL', () => '');
export const useModProfileName = () =>
  useState<string>('auth:modProfileName', () => '');
export const useNotificationCount = () =>
  useState<number>('auth:notificationCount', () => 0);

// Imperative setters for the few call sites that mutate auth state directly
// (login seeding in plugins/auth-session.ts, logout, create-username, test
// helpers). Reads should prefer the `useX()` composables above.
export const setIsAuthenticated = (value: boolean) => {
  useIsAuthenticated().value = value;
};
export const setUsername = (value: string) => {
  useUsername().value = value;
};
export const setEmail = (value: string) => {
  useEmail().value = value;
};
export const setProfilePicURL = (value: string) => {
  useProfilePicURL().value = value;
};
export const setModProfileName = (value: string) => {
  useModProfileName().value = value;
};
export const setNotificationCount = (value: number) => {
  useNotificationCount().value = value;
};
