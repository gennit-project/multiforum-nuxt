import type { FetchResult } from '@apollo/client';
import type { ApolloError } from '@apollo/client/errors';

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
