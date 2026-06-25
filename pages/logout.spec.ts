import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

const push = vi.fn();
const setIsAuthenticated = vi.fn();
const setUsername = vi.fn();

vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/composables/useAuthState', () => ({
  setIsAuthenticated,
  setUsername,
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mountLogout = async () => {
  const Page = (await import('./logout.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: NuxtLayoutStub } },
  });
};

describe('logout page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the authenticated flag on mount', async () => {
    await mountLogout();
    expect(setIsAuthenticated).toHaveBeenCalledWith(false);
  });

  it('removes the stored auth token', async () => {
    localStorage.setItem('token', 'abc');
    await mountLogout();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('redirects to the stored post-logout path', async () => {
    localStorage.setItem('postLogoutRedirect', '/dashboard');
    await mountLogout();
    vi.advanceTimersByTime(500);
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('defaults the redirect to home when no path is stored', async () => {
    await mountLogout();
    vi.advanceTimersByTime(500);
    expect(push).toHaveBeenCalledWith('/');
  });
});
