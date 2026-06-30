import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ModdedForumsPage from './moddedForums.vue';
import ChannelList from '@/components/channel/ChannelList.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = (result: unknown, options: { loading?: boolean; error?: unknown } = {}) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    loading: ref(options.loading ?? false),
    error: ref(options.error ?? null),
  });
  return shallowMount(ModdedForumsPage);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('user modded forums page', () => {
  it('shows the loading state', () => {
    expect(mountWith(null, { loading: true }).text()).toContain('Loading...');
  });

  it('shows the error state', () => {
    expect(mountWith(null, { error: { message: 'boom' } }).text()).toContain('Error');
  });

  it('shows an empty-state message when the user mods no forums', () => {
    const wrapper = mountWith({
      users: [{ ModOfChannels: [], ModOfChannelsAggregate: { count: 0 } }],
    });
    expect(wrapper.text()).toContain('This user is not a mod in any forums.');
  });

  it('renders the channel list with the aggregate count when the user mods forums', () => {
    const wrapper = mountWith({
      users: [
        {
          ModOfChannels: [{ uniqueName: 'cats' }],
          ModOfChannelsAggregate: { count: 1 },
        },
      ],
    });
    expect(wrapper.findComponent(ChannelList).props()).toEqual({
      channels: [{ uniqueName: 'cats' }],
      resultCount: 1,
      searchInput: '',
      selectedTags: [],
      loading: false,
    });
  });
});
