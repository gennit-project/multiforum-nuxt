import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const h = vi.hoisted(() => ({
  push: vi.fn(),
  onResult: null as null | ((result: { data?: { getOwnEmail?: { username?: string | null } | null } }) => void),
  username: null as unknown as { value: string },
  isAuthenticated: null as unknown as { value: boolean },
  email: null as unknown as { value: string },
  userDataLoadingVar: null as unknown as { value: boolean },
}));

h.username = ref('');
h.isAuthenticated = ref(false);
h.email = ref('alice@example.com');
h.userDataLoadingVar = ref(false);

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: h.push }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    onResult: (cb: typeof h.onResult) => {
      h.onResult = cb;
    },
  }),
}));

vi.mock('@/graphQLData/email/queries', () => ({
  GET_OWN_EMAIL: 'GET_OWN_EMAIL',
}));

vi.mock('@/cache', () => ({
  userDataLoadingVar: h.userDataLoadingVar,
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useIsAuthenticated: () => h.isAuthenticated,
  useEmail: () => h.email,
}));

const stubs = {
  LoadingSpinner: { name: 'LoadingSpinner', template: '<div class="spinner" />' },
  CreateUsernameForm: {
    name: 'CreateUsernameForm',
    props: ['email'],
    emits: ['email-and-user-created'],
    template: '<button class="create-form" @click="$emit(\'email-and-user-created\')" />',
  },
};

const mountPage = async () => {
  const Page = (await import('./create-username.vue')).default;
  return mountWithDefaults(Page, { global: { stubs } });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.onResult = null;
  h.username.value = '';
  h.isAuthenticated.value = false;
  h.email.value = 'alice@example.com';
  h.userDataLoadingVar.value = false;
  localStorage.clear();
  sessionStorage.clear();
});

describe('create-username page', () => {
  it('redirects unauthenticated users to home on mount', async () => {
    await mountPage();
    expect(h.push).toHaveBeenCalledWith('/');
  });

  it('redirects authenticated users with a stored username back to the previous path', async () => {
    h.isAuthenticated.value = true;
    localStorage.setItem('username', 'alice');
    sessionStorage.setItem('previousPath', '/forums/cats');

    await mountPage();

    expect(h.push).toHaveBeenCalledWith('/forums/cats');
  });

  it('shows the create username form when the verified email is not yet in the system', async () => {
    h.isAuthenticated.value = true;
    const wrapper = await mountPage();

    h.onResult?.({ data: { getOwnEmail: { username: null } } });
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'CreateUsernameForm' }).props('email')).toBe(
      'alice@example.com'
    );
  });

  it('redirects authenticated users home when the email query returns an existing username', async () => {
    h.isAuthenticated.value = true;
    await mountPage();

    h.onResult?.({ data: { getOwnEmail: { username: 'alice' } } });

    expect(h.push).toHaveBeenCalledWith('/');
  });

  // This standalone onboarding page renders without the default layout, so it
  // needs its own main landmark (also the target for route-change focus).
  it('exposes a main landmark for the page content', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('main#main-content').exists()).toBe(true);
  });
});
