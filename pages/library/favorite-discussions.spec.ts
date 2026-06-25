import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({ serverAdminUsernames: ref([]) }),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (favorites: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ users: [{ FavoriteDiscussions: favorites }] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./favorite-discussions.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { RequireAuth: RequireAuthStub, NuxtLink: { template: '<a><slot /></a>' } } },
  });
};

describe('favorite discussions page', () => {
  it('shows the empty state when there are no favorites', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No favorite discussions yet');
  });

  it('renders a favorited discussion title', async () => {
    const wrapper = await mountWith([
      {
        id: 'd1',
        title: 'My favorite post',
        DiscussionChannels: [
          { channelUniqueName: 'cats', CommentsAggregate: { count: 0 } },
        ],
        Tags: [],
        Album: null,
      },
    ]);
    expect(wrapper.text()).toContain('My favorite post');
  });
});
