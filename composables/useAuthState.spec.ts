import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useIsAuthenticated,
  useUsername,
  useNotificationCount,
  setIsAuthenticated,
  setUsername,
  setNotificationCount,
} from './useAuthState';

const mockStateStore = new Map<string, { value: unknown }>();

vi.mock('nuxt/app', () => ({
  useState: (key: string, init: () => unknown) => {
    if (!mockStateStore.has(key)) {
      mockStateStore.set(key, { value: init() });
    }
    return mockStateStore.get(key);
  },
}));

beforeEach(() => mockStateStore.clear());

describe('useAuthState defaults', () => {
  it('defaults isAuthenticated to false', () => {
    expect(useIsAuthenticated().value).toBe(false);
  });

  it('defaults username to an empty string', () => {
    expect(useUsername().value).toBe('');
  });

  it('defaults the notification count to 0', () => {
    expect(useNotificationCount().value).toBe(0);
  });
});

describe('useAuthState setters', () => {
  it('setIsAuthenticated updates the state the getter reads', () => {
    setIsAuthenticated(true);
    expect(useIsAuthenticated().value).toBe(true);
  });

  it('setUsername updates the username state', () => {
    setUsername('alice');
    expect(useUsername().value).toBe('alice');
  });

  it('setNotificationCount updates the count state', () => {
    setNotificationCount(7);
    expect(useNotificationCount().value).toBe(7);
  });
});
