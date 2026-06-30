import { describe, it, expect, vi, beforeEach } from 'vitest';

import plugin from '@/plugins/test-auth.client';

const h = vi.hoisted(() => ({
  isAuthenticated: { value: false },
  username: { value: '' },
  email: { value: '' },
  modProfileName: { value: '' },
  setIsAuthenticated: vi.fn(),
  setUsername: vi.fn(),
  setEmail: vi.fn(),
  setModProfileName: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  defineNuxtPlugin: (fn: unknown) => fn,
}));

vi.mock('@/config', () => ({
  config: { environment: 'test' },
}));

vi.mock('@/composables/useAuthState', () => ({
  setUsername: h.setUsername,
  setEmail: h.setEmail,
  setModProfileName: h.setModProfileName,
  setIsAuthenticated: h.setIsAuthenticated,
  useIsAuthenticated: () => h.isAuthenticated,
  useUsername: () => h.username,
  useEmail: () => h.email,
  useModProfileName: () => h.modProfileName,
}));

const run = () => {
  (plugin as () => void)();
};

beforeEach(() => {
  vi.clearAllMocks();
  h.isAuthenticated.value = false;
  h.username.value = '';
  h.email.value = '';
  h.modProfileName.value = '';
  localStorage.clear();
  delete (window as typeof window & { __SET_AUTH_STATE_DIRECT__?: unknown })
    .__SET_AUTH_STATE_DIRECT__;
  delete (window as typeof window & { __DEBUG_AUTH_STATE__?: unknown })
    .__DEBUG_AUTH_STATE__;
});

describe('test-auth client plugin', () => {
  it('treats a token with an empty mock username as authenticated', () => {
    localStorage.setItem(
      'token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5ld2NvbWVyQGV4YW1wbGUuY29tIn0.mock-signature'
    );
    localStorage.setItem('mock_username', '');

    run();

    expect({
      authenticated: h.setIsAuthenticated.mock.calls,
      username: h.setUsername.mock.calls,
      email: h.setEmail.mock.calls,
      state: h.isAuthenticated.value,
    }).toEqual({
      authenticated: [[true]],
      username: [['']],
      email: [['newcomer@example.com']],
      state: true,
    });
  });

  it('still exposes the debug auth helpers when only the token is present', () => {
    localStorage.setItem('token', 'mock-token');

    run();

    expect(
      typeof (window as typeof window & { __SET_AUTH_STATE_DIRECT__?: unknown })
        .__SET_AUTH_STATE_DIRECT__
    ).toBe('function');
  });
});
