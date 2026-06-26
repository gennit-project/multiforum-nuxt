import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useServerLogout } from './useServerLogout';

const setIsAuthenticated = vi.fn();
const setUsername = vi.fn();
const clearPersistedAuth = vi.fn();

vi.mock('@/composables/useAuthState', () => ({
  setIsAuthenticated: (v: boolean) => setIsAuthenticated(v),
  setUsername: (v: string) => setUsername(v),
}));

vi.mock('@/utils/authUtils', () => ({
  clearPersistedAuth: () => clearPersistedAuth(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('useServerLogout', () => {
  it('remembers the current path for post-logout redirect', () => {
    useServerLogout().logout();
    expect(window.localStorage.getItem('postLogoutRedirect')).not.toBeNull();
  });

  it('clears the authenticated flag', () => {
    useServerLogout().logout();
    expect(setIsAuthenticated).toHaveBeenCalledWith(false);
  });

  it('clears the persisted username', () => {
    useServerLogout().logout();
    expect(setUsername).toHaveBeenCalledWith('');
  });

  it('clears persisted auth before handing off to the server route', () => {
    useServerLogout().logout();
    expect(clearPersistedAuth).toHaveBeenCalled();
  });
});
