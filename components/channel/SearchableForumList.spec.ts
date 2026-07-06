import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { asMock, createQueryMock } from '@/tests/utils/mockApollo';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createAuthStateMock } from '@/tests/utils/mockAuth';
import SearchableForumListItem from '@/components/channel/SearchableForumListItem.vue';
// vi.mock is hoisted above imports, so the component (imported below) picks up
// the mocked modules.
import SearchableForumList from '@/components/channel/SearchableForumList.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () =>
  createAuthStateMock({ username: 'alice' })
);

const makeChannel = (uniqueName: string) => ({
  uniqueName,
  displayName: uniqueName,
  channelIconURL: '',
  description: '',
});

// useQuery is called three times in setup order: channel names, favorites,
// collections. Only the channel-names result drives the unauthenticated view.
const setupQueries = (channels: ReturnType<typeof makeChannel>[]) => {
  asMock(useQuery)
    .mockReturnValueOnce(createQueryMock({ channels }))
    .mockReturnValueOnce(createQueryMock({ users: [] }))
    .mockReturnValueOnce(createQueryMock({ users: [] }));
};

describe('SearchableForumList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list item for each channel', () => {
    setupQueries([makeChannel('cats'), makeChannel('dogs')]);
    const wrapper = mountWithDefaults(SearchableForumList, {
      global: { stubs: { SearchBar: true } },
    });
    expect(wrapper.findAllComponents(SearchableForumListItem)).toHaveLength(2);
  });

  it('renders nothing when there are no channels', () => {
    setupQueries([]);
    const wrapper = mountWithDefaults(SearchableForumList, {
      global: { stubs: { SearchBar: true } },
    });
    expect(wrapper.findAllComponents(SearchableForumListItem)).toHaveLength(0);
  });
});

describe('SearchableForumList — favorites, collections, featured', () => {
  beforeEach(() => vi.clearAllMocks());

  const setupRich = () => {
    asMock(useQuery)
      .mockReturnValueOnce(createQueryMock({ channels: [makeChannel('cats')] }))
      .mockReturnValueOnce(
        createQueryMock({
          users: [
            {
              FavoriteChannels: [makeChannel('favforum'), makeChannel('otherfav')],
            },
          ],
        })
      )
      .mockReturnValueOnce(
        createQueryMock({
          users: [
            {
              Collections: [
                {
                  id: 'col1',
                  name: 'My Collection',
                  Channels: [makeChannel('colforum')],
                },
              ],
            },
          ],
        })
      );
  };

  const searchBarStub = {
    SearchBar: {
      template:
        '<input class="search-bar" @input="$emit(\'update-search-input\', $event.target.value)" />',
    },
  };

  const mountRich = (props: Record<string, unknown> = {}) => {
    setupRich();
    return mountWithDefaults(SearchableForumList, {
      props: {
        featuredForums: [makeChannel('featuredforum')],
        selectedChannels: [],
        ...props,
      },
      global: { stubs: searchBarStub },
    });
  };

  it('renders the favorite channels', () => {
    expect(mountRich().text()).toContain('favforum');
  });

  it('renders the channel collections', () => {
    expect(mountRich().text()).toContain('My Collection');
  });

  it('renders the featured channels', () => {
    expect(mountRich().text()).toContain('featuredforum');
  });

  it('toggles selection for all favorites', async () => {
    const wrapper = mountRich();
    await wrapper.findAll('input[type="checkbox"]')[0].trigger('click');

    expect(wrapper.emitted('toggleSelection')).toBeTruthy();
  });

  it('filters favorites by the search term', async () => {
    const wrapper = mountRich();
    await wrapper.find('.search-bar').setValue('favforum');

    expect(wrapper.text()).not.toContain('otherfav');
  });
});

describe('SearchableForumList — collections, expansion, query states', () => {
  beforeEach(() => vi.clearAllMocks());

  const searchBarStub = { SearchBar: { template: '<div />' } };

  // channels / favorites / collections queries, in the order the component calls them.
  const setup = (opts: {
    channels?: ReturnType<typeof makeChannel>[];
    favorites?: ReturnType<typeof makeChannel>[];
    collections?: Array<{ id: string; name: string; Channels: ReturnType<typeof makeChannel>[] }>;
    channelOverrides?: Record<string, unknown>;
  }) => {
    asMock(useQuery)
      .mockReturnValueOnce(
        createQueryMock({ channels: opts.channels ?? [] }, opts.channelOverrides)
      )
      .mockReturnValueOnce(
        createQueryMock({ users: [{ FavoriteChannels: opts.favorites ?? [] }] })
      )
      .mockReturnValueOnce(
        createQueryMock({ users: [{ Collections: opts.collections ?? [] }] })
      );
  };

  const mountList = (props: Record<string, unknown> = {}) =>
    mountWithDefaults(SearchableForumList, {
      props: { selectedChannels: [], ...props },
      global: { stubs: searchBarStub },
    });

  it('emits setChannelNames when the channel-names query resolves', () => {
    asMock(useQuery)
      .mockReturnValueOnce(
        createQueryMock(
          { channels: [makeChannel('cats')] },
          { onResult: ((cb: () => void) => cb()) as never }
        )
      )
      .mockReturnValueOnce(createQueryMock({ users: [] }))
      .mockReturnValueOnce(createQueryMock({ users: [] }));

    const wrapper = mountList();
    expect(wrapper.emitted('setChannelNames')).toBeTruthy();
  });

  it('shows the loading state before any channels arrive', () => {
    setup({ channels: [], channelOverrides: { loading: ref(true) } });
    expect(mountList().text()).toContain('Loading...');
  });

  it('renders graphQL error messages when the query fails', () => {
    setup({
      channelOverrides: {
        error: ref({ graphQLErrors: [{ message: 'Boom happened' }] }),
      },
    });
    expect(mountList().text()).toContain('Boom happened');
  });

  const collectionWithChannels = (names: string[]) => ({
    id: 'col1',
    name: 'Big Collection',
    Channels: names.map(makeChannel),
  });

  it('toggles selection for all channels in a collection', async () => {
    setup({ collections: [collectionWithChannels(['ca', 'cb'])] });
    const wrapper = mountList();
    const checkbox = wrapper.get('input[aria-label="Select all forums in Big Collection"]');
    await checkbox.trigger('click');

    expect(wrapper.emitted('toggleSelection')).toBeTruthy();
  });

  it('marks the collection checkbox checked when all its channels are selected', () => {
    setup({ collections: [collectionWithChannels(['ca', 'cb'])] });
    const wrapper = mountList({ selectedChannels: ['ca', 'cb'] });
    const checkbox = wrapper.get(
      'input[aria-label="Select all forums in Big Collection"]'
    );

    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it('expands and collapses a collection with more than three channels', async () => {
    setup({ collections: [collectionWithChannels(['ca', 'cb', 'cc', 'cd'])] });
    const wrapper = mountList();
    const showMore = wrapper.findAll('button').find((b) => b.text().includes('show more'))!;
    await showMore.trigger('click');
    const showLess = wrapper.findAll('button').find((b) => b.text().includes('show less'))!;
    await showLess.trigger('click');

    expect(
      wrapper.findAll('button').some((b) => b.text().includes('show more'))
    ).toBe(true);
  });

  it('expands the favorites preview when there are more than three', async () => {
    setup({
      favorites: [makeChannel('f1'), makeChannel('f2'), makeChannel('f3'), makeChannel('f4')],
    });
    const wrapper = mountList();
    const showAll = wrapper.findAll('button').find((b) => b.text().includes('show all'))!;
    await showAll.trigger('click');

    expect(
      wrapper.findAll('button').some((b) => b.text().includes('show less'))
    ).toBe(true);
  });

  it('syncs internal selection when the selectedChannels prop changes', async () => {
    setup({ channels: [makeChannel('cats')] });
    const wrapper = mountList();
    await wrapper.setProps({ selectedChannels: ['cats'] });

    expect(wrapper.findComponent(SearchableForumListItem).props('selected')).toContain(
      'cats'
    );
  });
});
