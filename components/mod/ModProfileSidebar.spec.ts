import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ModProfileSidebar from '@/components/mod/ModProfileSidebar.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  route: null as unknown,
  modProfileName: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, error: h.error }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useAuthState', () => ({ useModProfileName: () => h.modProfileName }));

const mod = (overrides: Record<string, unknown> = {}) => ({
  displayName: 'mod1',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mountSidebar = () =>
  mount(ModProfileSidebar, {
    global: { stubs: { AvatarComponent: true } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ moderationProfiles: [mod()] });
  h.error = ref(null);
  h.route = { params: { modId: 'mod1' } };
  h.modProfileName = ref('');
});

describe('ModProfileSidebar', () => {
  it('shows the mod display name', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('mod1');
  });

  it('shows a (You) marker when viewing your own profile', () => {
    h.modProfileName = ref('mod1');
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('(You)');
  });

  it('hides the (You) marker for another mod', () => {
    h.modProfileName = ref('other');
    const wrapper = mountSidebar();

    expect(wrapper.text()).not.toContain('(You)');
  });

  it('shows the joined date', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Joined');
  });

  it('shows a not-found message when there is no mod', () => {
    h.result = ref({ moderationProfiles: [] });
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Could not find the user');
  });

  it('shows query errors', () => {
    h.error = ref({ graphQLErrors: [{ message: 'boom' }] });
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('boom');
  });
});
