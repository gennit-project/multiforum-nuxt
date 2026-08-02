import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ChannelList from '@/components/channel/ChannelList.vue';
import SearchBar from '@/components/SearchBar.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';

const mockState = vi.hoisted(() => ({
  route: { query: {} as Record<string, unknown> },
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  fetchMoreChannels: vi.fn(),
  fetchMoreDownloads: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => mockState.route,
  useRouter: () => ({
    push: mockState.routerPush,
    replace: mockState.routerReplace,
  }),
  useHead: vi.fn(),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('viewer'),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

const SlotStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const FilterChipStub = defineComponent({
  name: 'FilterChip',
  props: { label: String, highlighted: Boolean },
  setup(_props, { slots }) {
    return () => h('div', slots.content?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  channels?: unknown[];
  total?: number;
  downloads?: unknown[];
  loading?: boolean;
  error?: unknown;
  noResult?: boolean;
}) => {
  const channels = opts.channels ?? [];
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref(
        opts.noResult
          ? undefined
          : {
              getSortedChannels: {
                channels,
                aggregateChannelCount: opts.total ?? channels.length,
              },
            }
      ),
      loading: ref(opts.loading ?? false),
      error: ref(opts.error ?? null),
      fetchMore: mockState.fetchMoreChannels,
    })
    .mockReturnValueOnce({
      result: ref({ getSortedChannels: { channels: opts.downloads ?? [] } }),
      fetchMore: mockState.fetchMoreDownloads,
    });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        NuxtLayout: SlotStub,
        ClientOnly: SlotStub,
        RequireAuth: true,
        FilterChip: FilterChipStub,
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockState.route.query = {};
});

describe('forums index page', () => {
  it('renders the channel list with the result count', async () => {
    const wrapper = await mountWith({
      channels: [
        { uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } },
      ],
      total: 1,
    });
    expect(wrapper.findComponent(ChannelList).props('resultCount')).toBe(1);
  });

  it('merges download counts onto the channels', async () => {
    const wrapper = await mountWith({
      channels: [
        { uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } },
      ],
      downloads: [
        { uniqueName: 'cats', DiscussionChannelsAggregate: { count: 2 } },
      ],
    });
    const channels = wrapper
      .findComponent(ChannelList)
      .props('channels') as Array<{
      downloadCount: number;
    }>;
    expect(channels[0].downloadCount).toBe(2);
  });

  it('preserves channel favorite state from the list query', async () => {
    const wrapper = await mountWith({
      channels: [
        {
          uniqueName: 'cats',
          isFavorited: true,
          DiscussionChannelsAggregate: { count: 0 },
        },
      ],
    });
    const channels = wrapper
      .findComponent(ChannelList)
      .props('channels') as Array<{
      isFavorited: boolean;
    }>;
    expect(channels[0].isFavorited).toBe(true);
  });

  it('initializes search and tag filters from the route', async () => {
    mockState.route.query = { searchInput: 'space', tag: 'science' };
    const wrapper = await mountWith({ channels: [] });

    expect({
      search: wrapper.findComponent(SearchBar).props('initialValue'),
      tags: wrapper.findComponent(SearchableTagList).props('selectedTags'),
    }).toEqual({ search: 'space', tags: ['science'] });
  });

  it('writes search changes to the route query', async () => {
    mockState.route.query = { tag: 'science' };
    const wrapper = await mountWith({ channels: [] });

    wrapper
      .findComponent(SearchBar)
      .vm.$emit('update-search-input', 'astronomy');

    expect(mockState.routerReplace).toHaveBeenCalledWith({
      query: { tag: 'science', searchInput: 'astronomy' },
    });
  });

  it('removes an empty search from the route query', async () => {
    mockState.route.query = { searchInput: 'old' };
    const wrapper = await mountWith({ channels: [] });

    wrapper.findComponent(SearchBar).vm.$emit('update-search-input', '');

    expect(mockState.routerReplace).toHaveBeenCalledWith({
      query: { searchInput: undefined },
    });
  });

  it('toggles a selected tag into the route', async () => {
    const wrapper = await mountWith({ channels: [] });

    wrapper
      .findComponent(SearchableTagList)
      .vm.$emit('toggle-selection', 'science');

    expect(mockState.routerPush).toHaveBeenCalledWith({
      query: { tag: ['science'] },
    });
  });

  it('normalizes array tag query values', async () => {
    mockState.route.query = { tag: ['science', null, 42] };
    const wrapper = await mountWith({ channels: [] });

    expect(
      wrapper.findComponent(SearchableTagList).props('selectedTags')
    ).toEqual(['science', '', '42']);
  });

  it('renders the query error', async () => {
    const wrapper = await mountWith({
      error: new Error('Channels unavailable'),
    });

    expect(wrapper.findComponent(ErrorBanner).props('text')).toBe(
      'Channels unavailable'
    );
  });

  it('renders a loading skeleton while the first result is pending', async () => {
    const wrapper = await mountWith({ loading: true, noResult: true });

    expect(wrapper.find('.animate-pulse').exists()).toBe(true);
  });

  it('loads the next page for both channel count queries', async () => {
    const wrapper = await mountWith({
      channels: [{ uniqueName: 'cats' }, { uniqueName: 'dogs' }],
    });

    wrapper.findComponent(ChannelList).vm.$emit('load-more');

    expect({
      channels: mockState.fetchMoreChannels.mock.calls[0]?.[0].variables,
      downloads: mockState.fetchMoreDownloads.mock.calls[0]?.[0].variables,
    }).toEqual({ channels: { offset: 2 }, downloads: { offset: 2 } });
  });

  it('appends fetch-more results to both channel lists', async () => {
    const wrapper = await mountWith({ channels: [{ uniqueName: 'cats' }] });
    wrapper.findComponent(ChannelList).vm.$emit('load-more');
    const updateChannels =
      mockState.fetchMoreChannels.mock.calls[0]?.[0].updateQuery;
    const updateDownloads =
      mockState.fetchMoreDownloads.mock.calls[0]?.[0].updateQuery;
    const previous = {
      getSortedChannels: { channels: [{ uniqueName: 'cats' }] },
    };
    const next = { getSortedChannels: { channels: [{ uniqueName: 'dogs' }] } };

    expect({
      channels: updateChannels(previous, { fetchMoreResult: next })
        .getSortedChannels.channels,
      downloads: updateDownloads(previous, { fetchMoreResult: next })
        .getSortedChannels.channels,
    }).toEqual({
      channels: [{ uniqueName: 'cats' }, { uniqueName: 'dogs' }],
      downloads: [{ uniqueName: 'cats' }, { uniqueName: 'dogs' }],
    });
  });

  it('keeps previous results when fetch-more returns nothing', async () => {
    const wrapper = await mountWith({ channels: [] });
    wrapper.findComponent(ChannelList).vm.$emit('load-more');
    const updateChannels =
      mockState.fetchMoreChannels.mock.calls[0]?.[0].updateQuery;
    const previous = { getSortedChannels: { channels: [] } };

    expect(updateChannels(previous, { fetchMoreResult: null })).toBe(previous);
  });
});
