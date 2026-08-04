import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import LoginPage from './login.vue';

const h = vi.hoisted(() => ({
  provider: 'local-dev',
  query: { returnTo: '/admin/setup' } as Record<string, unknown>,
  navigateTo: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  navigateTo: h.navigateTo,
  useHead: vi.fn(),
  useRoute: () => ({ query: h.query }),
  useRuntimeConfig: () => ({ public: { authProvider: h.provider } }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.provider = 'local-dev';
  h.query = { returnTo: '/admin/setup' };
  h.fetch.mockResolvedValue({ authenticated: true });
  vi.stubGlobal('$fetch', h.fetch);
});

describe('local sign-in page', () => {
  it('labels the flow as local development authentication', () => {
    const wrapper = mountWithDefaults(LoginPage);
    expect(wrapper.text()).toContain('Local development authentication');
  });

  it('submits the bootstrap password to the same-origin session endpoint', async () => {
    const wrapper = mountWithDefaults(LoginPage);
    await wrapper.get('input').setValue('local-password');
    await wrapper.get('form').trigger('submit');
    expect(h.fetch).toHaveBeenCalledWith('/api/auth/local-dev/login', {
      method: 'POST',
      body: { password: 'local-password' },
    });
  });

  it('performs a full navigation to the requested page after sign-in', async () => {
    const wrapper = mountWithDefaults(LoginPage);
    await wrapper.get('input').setValue('local-password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(h.navigateTo).toHaveBeenCalledWith('/admin/setup', {
      external: true,
    });
  });

  it('rejects a protocol-relative return URL', async () => {
    h.query = { returnTo: '//attacker.example' };
    const wrapper = mountWithDefaults(LoginPage);
    await wrapper.get('input').setValue('local-password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(h.navigateTo).toHaveBeenCalledWith('/', { external: true });
  });

  it('shows a credential-specific error for a rejected password', async () => {
    h.fetch.mockRejectedValue({ response: { status: 401 } });
    const wrapper = mountWithDefaults(LoginPage);
    await wrapper.get('input').setValue('wrong-password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      'That password was not accepted.'
    );
  });

  it('hands Auth0 deployments back to the existing login route', async () => {
    h.provider = 'auth0';
    mountWithDefaults(LoginPage);
    await flushPromises();
    expect(h.navigateTo).toHaveBeenCalledWith(
      '/auth/login?returnTo=%2Fadmin%2Fsetup',
      {
        external: true,
      }
    );
  });
});
