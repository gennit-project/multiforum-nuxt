import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const h = vi.hoisted(() => ({
  push: vi.fn(),
  username: null as unknown as { value: string },
  isAuthenticated: null as unknown as { value: boolean },
  email: null as unknown as { value: string },
}));

h.username = ref('');
h.isAuthenticated = ref(false);
h.email = ref('alice@example.com');

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: h.push, replace: h.push }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useIsAuthenticated: () => h.isAuthenticated,
  useEmail: () => h.email,
}));

const stubs = {
  CreateUsernameForm: {
    name: 'CreateUsernameForm',
    props: ['email'],
    emits: ['email-and-user-created'],
    template:
      '<button class="create-form" @click="$emit(\'email-and-user-created\')" />',
  },
};

const mountPage = async () => {
  const Page = (await import('./create-username.vue')).default;
  return mountWithDefaults(Page, { global: { stubs } });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.username.value = '';
  h.isAuthenticated.value = false;
  h.email.value = 'alice@example.com';
  localStorage.clear();
  sessionStorage.clear();
});

describe('create-username page', () => {
  it('redirects unauthenticated users to home on mount', async () => {
    await mountPage();
    expect(h.push).toHaveBeenCalledWith('/');
  });

  it('ignores a stale stored username from another account', async () => {
    h.isAuthenticated.value = true;
    localStorage.setItem('username', 'alice');
    sessionStorage.setItem('previousPath', '/forums/cats');

    await mountPage();

    expect(h.push).not.toHaveBeenCalled();
  });

  it('shows recovery immediately without waiting for another GraphQL lookup', async () => {
    h.isAuthenticated.value = true;
    const wrapper = await mountPage();
    expect(
      wrapper.findComponent({ name: 'CreateUsernameForm' }).props('email')
    ).toBe('alice@example.com');
  });

  // This standalone onboarding page renders without the default layout, so it
  // needs its own main landmark (also the target for route-change focus).
  it('exposes a main landmark for the page content', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('main#main-content').exists()).toBe(true);
  });
});

describe('onboarding completion navigation', () => {
  it('returns to the original route after the session gets a username', async () => {
    h.isAuthenticated.value = true;
    sessionStorage.setItem('previousPath', '/forums?sort=new');
    const wrapper = await mountPage();
    h.username.value = 'newcomer';
    await wrapper.vm.$nextTick();
    expect(h.push).toHaveBeenCalledWith('/forums?sort=new');
  });

  it.each(['/create-username', '//other.example/path'])(
    'rejects an invalid return path: %s',
    async (path) => {
      h.isAuthenticated.value = true;
      h.username.value = 'alice';
      sessionStorage.setItem('previousPath', path);
      await mountPage();
      expect(h.push).toHaveBeenCalledWith('/');
    }
  );
});
