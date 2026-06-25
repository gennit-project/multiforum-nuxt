import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ApolloError } from '@apollo/client/errors';
import {
  shouldRestoreUsername,
  persistUsername,
  clearPersistedAuth,
  handleAuthError,
  USERNAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from './authUtils';

afterEach(() => {
  window.localStorage.clear();
  delete (window as unknown as { refreshAuthToken?: unknown }).refreshAuthToken;
});

describe('shouldRestoreUsername', () => {
  it('restores only when both username and token are present', () => {
    expect(shouldRestoreUsername('alice', 'tok')).toBe(true);
  });

  it('does not restore a username without a token (ghost login)', () => {
    expect(shouldRestoreUsername('alice', null)).toBe(false);
  });
});

describe('persistUsername', () => {
  it('writes the username to localStorage', () => {
    persistUsername('alice');
    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBe('alice');
  });

  it('is a no-op for an empty username', () => {
    persistUsername('');
    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
  });
});

describe('clearPersistedAuth', () => {
  it('removes both the username and token', () => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, 'alice');
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    clearPersistedAuth();
    expect([
      window.localStorage.getItem(USERNAME_STORAGE_KEY),
      window.localStorage.getItem(TOKEN_STORAGE_KEY),
    ]).toEqual([null, null]);
  });
});

describe('handleAuthError', () => {
  const authError = {
    graphQLErrors: [{ message: 'session expired' }],
  } as unknown as ApolloError;

  it('refreshes the token and retries on an auth error', async () => {
    (window as unknown as { refreshAuthToken: () => Promise<boolean> }).refreshAuthToken =
      vi.fn().mockResolvedValue(true);
    const retryFn = vi.fn().mockResolvedValue({ data: 'ok' });
    const result = await handleAuthError(authError, retryFn);
    expect(result).toEqual({ data: 'ok' });
  });

  it('rethrows the original error for a non-auth error', async () => {
    const otherError = {
      graphQLErrors: [{ message: 'bad input' }],
    } as unknown as ApolloError;
    await expect(handleAuthError(otherError, vi.fn())).rejects.toBe(otherError);
  });
});
