import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useIsAuthenticated,
  useUsername,
  useEmail,
  useProfilePicURL,
  useModProfileName,
  useNotificationCount,
  setIsAuthenticated,
  setUsername,
  setEmail,
  setProfilePicURL,
  setModProfileName,
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

  it('defaults email to an empty string', () => {
    expect(useEmail().value).toBe('');
  });

  it('defaults profilePicURL to an empty string', () => {
    expect(useProfilePicURL().value).toBe('');
  });

  it('defaults modProfileName to an empty string', () => {
    expect(useModProfileName().value).toBe('');
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

  it('setEmail updates the email state', () => {
    setEmail('alice@example.com');
    expect(useEmail().value).toBe('alice@example.com');
  });

  it('setProfilePicURL updates the profilePicURL state', () => {
    setProfilePicURL('https://example.com/pic.png');
    expect(useProfilePicURL().value).toBe('https://example.com/pic.png');
  });

  it('setModProfileName updates the modProfileName state', () => {
    setModProfileName('mod-alice');
    expect(useModProfileName().value).toBe('mod-alice');
  });
});
