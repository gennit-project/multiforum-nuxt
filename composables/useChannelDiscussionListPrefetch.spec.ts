import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApolloClient } from '@vue/apollo-composable';
import { preloadRouteComponents } from 'nuxt/app';
import { SortType, TimeFrame } from '@/__generated__/graphql';
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from '@/graphQLData/discussion/queries';
import { useChannelDiscussionListPrefetch } from './useChannelDiscussionListPrefetch';

const query = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  preloadRouteComponents: vi.fn(),
}));

describe('useChannelDiscussionListPrefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApolloClient).mockReturnValue({ client: { query } } as never);
    vi.mocked(preloadRouteComponents).mockResolvedValue(undefined);
    query.mockResolvedValue({ data: {} });
  });

  it('preloads the route and Apollo cache entry used by the channel list', async () => {
    const { prefetchChannelDiscussionList } =
      useChannelDiscussionListPrefetch();

    await prefetchChannelDiscussionList('quilting');

    expect(preloadRouteComponents).toHaveBeenCalledWith(
      '/forums/quilting/discussions'
    );
    expect(query).toHaveBeenCalledWith({
      query: GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
      variables: {
        channelUniqueName: 'quilting',
        searchInput: '',
        selectedTags: [],
        showArchived: false,
        hasDownload: false,
        showUnanswered: false,
        options: {
          limit: 25,
          offset: 0,
          sort: SortType.Hot,
          timeFrame: TimeFrame.Month,
        },
      },
      fetchPolicy: 'cache-first',
    });
  });

  it('does not prefetch without a channel', async () => {
    const { prefetchChannelDiscussionList } =
      useChannelDiscussionListPrefetch();

    await prefetchChannelDiscussionList('');

    expect(query).not.toHaveBeenCalled();
  });
});
