import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloError } from '@apollo/client/errors';
import { GraphQLError } from 'graphql';
import {
  handleAuthError,
  shouldRestoreUsername,
  persistUsername,
  clearPersistedAuth,
  USERNAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '@/utils/authUtils';

describe('authUtils', () => {
  const originalRefresh = (window as any).refreshAuthToken;

  beforeEach(() => {
    (window as any).refreshAuthToken = undefined;
  });

  afterEach(() => {
    (window as any).refreshAuthToken = originalRefresh;
    vi.restoreAllMocks();
  });

  it('calls refreshAuthToken for auth-related errors', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('session expired')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(true);
    (window as any).refreshAuthToken = refreshAuthToken;

    await handleAuthError(error, retryFn);

    expect(refreshAuthToken).toHaveBeenCalledTimes(1);
  });

  it('retries the operation after refresh succeeds', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('session expired')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(true);
    (window as any).refreshAuthToken = refreshAuthToken;

    await handleAuthError(error, retryFn);

    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  it('returns the retry result after refresh succeeds', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('session expired')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(true);
    (window as any).refreshAuthToken = refreshAuthToken;

    const result = await handleAuthError(error, retryFn);

    expect(result).toEqual({ data: { ok: true } });
  });

  it('throws original error when refresh fails', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('authentication failed')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(false);
    (window as any).refreshAuthToken = refreshAuthToken;

    await expect(handleAuthError(error, retryFn)).rejects.toBe(error);
  });

  it('does not retry when refresh fails', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('authentication failed')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(false);
    (window as any).refreshAuthToken = refreshAuthToken;

    await expect(handleAuthError(error, retryFn)).rejects.toBe(error);

    expect(retryFn).not.toHaveBeenCalled();
  });

  it('throws original error when no auth error is detected', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('something else')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(true);
    (window as any).refreshAuthToken = refreshAuthToken;

    await expect(handleAuthError(error, retryFn)).rejects.toBe(error);
  });

  it('does not attempt refresh when no auth error is detected', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('something else')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const refreshAuthToken = vi.fn().mockResolvedValue(true);
    (window as any).refreshAuthToken = refreshAuthToken;

    await expect(handleAuthError(error, retryFn)).rejects.toBe(error);

    expect(refreshAuthToken).not.toHaveBeenCalled();
  });

  it('throws original error when refreshAuthToken is missing', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('unauthorized')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });

    await expect(handleAuthError(error, retryFn)).rejects.toBe(error);
  });

  it('does not retry when refreshAuthToken is missing', async () => {
    const error = new ApolloError({
      graphQLErrors: [new GraphQLError('unauthorized')],
    });
    const retryFn = vi.fn().mockResolvedValue({ data: { ok: true } });

    await expect(handleAuthError(error, retryFn)).rejects.toBe(error);

    expect(retryFn).not.toHaveBeenCalled();
  });
});

describe('shouldRestoreUsername', () => {
  it.each([
    ['username + token', 'cluse', 'jwt-token', true],
    ['username, no token', 'cluse', null, false],
    ['token, no username', null, 'jwt-token', false],
    ['neither', null, null, false],
    ['empty username + token', '', 'jwt-token', false],
    ['username + empty token', 'cluse', '', false],
  ])(
    'returns %s -> %s',
    (_label, storedUsername, token, expected) => {
      expect(
        shouldRestoreUsername(
          storedUsername as string | null,
          token as string | null
        )
      ).toBe(expected);
    }
  );
});

describe('persistUsername', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('writes the username to localStorage', () => {
    persistUsername('cluse');

    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBe('cluse');
  });

  it.each([['empty string', ''], ['null', null], ['undefined', undefined]])(
    'does not write when username is %s',
    (_label, value) => {
      persistUsername(value as string | null | undefined);

      expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
    }
  );
});

describe('clearPersistedAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('removes the persisted username', () => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, 'cluse');
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');

    clearPersistedAuth();

    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
  });

  it('removes the persisted token', () => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, 'cluse');
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt-token');

    clearPersistedAuth();

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('leaves unrelated keys intact', () => {
    window.localStorage.setItem('theme', 'dark');

    clearPersistedAuth();

    expect(window.localStorage.getItem('theme')).toBe('dark');
  });
});
