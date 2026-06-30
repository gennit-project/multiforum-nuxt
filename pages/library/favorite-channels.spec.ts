import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useHead: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const RequireAuthStub = defineComponent({
  name: 'RequireAuth',
  setup(_, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const LibraryChannelCardStub = defineComponent({
  name: 'LibraryChannelCard',
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },
  template: '<div>{{ channel.displayName }}</div>',
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (channels: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ users: [{ FavoriteChannels: channels }] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./favorite-channels.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        RequireAuth: RequireAuthStub,
        NuxtLink: { template: '<a><slot /></a>' },
        LibraryChannelCard: LibraryChannelCardStub,
      },
    },
  });
};

describe('favorite-channels page', () => {
  it('shows the empty state when there are no favorite forums', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No favorite forums yet');
  });

  it('renders a card for each favorite forum', async () => {
    const wrapper = await mountWith([
      { uniqueName: 'cats', displayName: 'Cats' },
      { uniqueName: 'dogs', displayName: 'Dogs' },
    ]);
    expect(wrapper.findAllComponents(LibraryChannelCardStub)).toHaveLength(2);
  });
});
