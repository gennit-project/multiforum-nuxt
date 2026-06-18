import type { FetchResult } from '@apollo/client';
import type { ApolloError } from '@apollo/client/errors';

export const USERNAME_STORAGE_KEY = 'username';
export const TOKEN_STORAGE_KEY = 'token';

/**
 * Decide whether a username persisted in localStorage should be restored into
 * reactive auth state on app load.
 *
 * The username is written at signup and never expires, but the auth token is
 * only present while a valid Auth0 session exists. Restoring the username
 * without a token produces a "ghost login": the UI looks authenticated while
 * every backend mutation is rejected with "You must be logged in to do that."
 * Only restore when both the username and a token are present.
 */
export function shouldRestoreUsername(
  storedUsername: string | null,
  token: string | null
): boolean {
  return Boolean(storedUsername && token);
}

/**
 * Persist the logged-in username so it can be restored on the next page load
 * (alongside the token written by the Auth0 session). No-op on the server or
 * when given an empty username.
 */
export function persistUsername(username: string | null | undefined): void {
  if (typeof window === 'undefined' || !username) {
    return;
  }
  window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
}

/**
 * Remove persisted auth (username + token) from localStorage. Called when auth
 * state is cleared (logout, invalid/expired refresh token) so a stale username
 * can't be restored on the next load and produce a ghost login.
 */
export function clearPersistedAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(USERNAME_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Helper function to handle GraphQL errors related to authentication
 * and automatically retry operations after refreshing the token
 *
 * @param error - The Apollo error from a failed operation
 * @param retryFn - Function to retry the operation
 * @returns The result of the retry or throws the original error
 */
export async function handleAuthError<T>(
  error: ApolloError,
  retryFn: () => Promise<FetchResult<T>>
): Promise<FetchResult<T>> {
  // Check if the error is related to authentication
  const isAuthError = error.graphQLErrors?.some(
    (e) =>
      e.message.includes('expired') ||
      e.message.includes('authentication') ||
      e.message.includes('unauthorized') ||
      e.message.includes('session')
  );

  if (isAuthError && window.refreshAuthToken) {
    const refreshSucceeded = await window.refreshAuthToken();

    if (refreshSucceeded) {
      // Retry the operation with the fresh token
      return await retryFn();
    }
  }

  // If not an auth error or token refresh failed, rethrow the original error
  throw error;
}

/**
 * Example usage:
 *
 * try {
 *   const result = await createDiscussion({
 *     variables: { ... }
 *   });
 * } catch (error) {
 *   if (error instanceof ApolloError) {
 *     try {
 *       // Try to refresh token and retry the mutation
 *       const retryResult = await handleAuthError(error, () =>
 *         createDiscussion({ variables: { ... } })
 *       );
 *       // Use retryResult if successful
 *     } catch (retryError) {
 *       // Handle final error
 *     }
 *   }
 * }
 */
