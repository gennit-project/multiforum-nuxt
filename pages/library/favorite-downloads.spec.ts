import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

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

const LibraryDownloadCardStub = defineComponent({
  name: 'LibraryDownloadCard',
  props: {
    download: {
      type: Object,
      required: true,
    },
  },
  template: '<div>{{ download.title }}</div>',
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (downloads: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ users: [{ FavoriteDiscussions: downloads }] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./favorite-downloads.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        RequireAuth: RequireAuthStub,
        NuxtLink: { template: '<a><slot /></a>' },
        LibraryDownloadCard: LibraryDownloadCardStub,
      },
    },
  });
};

describe('favorite downloads page', () => {
  it('shows the empty state when there are no favorites', async () => {
    expect((await mountWith([])).text()).toContain('No favorite downloads yet');
  });

  it('renders a favorited download title', async () => {
    const wrapper = await mountWith([
      {
        id: 'd1',
        title: 'Cool tileset',
        DiscussionChannels: [{ id: 'c', channelUniqueName: 'cats' }],
        Tags: [],
      },
    ]);
    expect(wrapper.text()).toContain('Cool tileset');
  });
});
