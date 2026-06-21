import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('@/composables/useAuthState', () => createAuthStateMock());

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
