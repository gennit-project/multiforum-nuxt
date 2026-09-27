import { useApolloClient } from '@vue/apollo-composable';
import { preloadRouteComponents } from 'nuxt/app';
import { SortType, TimeFrame } from '@/__generated__/graphql';
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from '@/graphQLData/discussion/queries';

const DISCUSSION_PAGE_LIMIT = 25;

export const useChannelDiscussionListPrefetch = () => {
  const { client } = useApolloClient();

  const prefetchChannelDiscussionList = async (channelUniqueName: string) => {
    if (!channelUniqueName || typeof window === 'undefined') return;

    const route = `/forums/${channelUniqueName}/discussions`;
    const variables = {
      channelUniqueName,
      searchInput: '',
      selectedTags: [],
      showArchived: false,
      hasDownload: false,
      showUnanswered: false,
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset: 0,
        sort: SortType.Hot,
        timeFrame: TimeFrame.Month,
      },
    };

    await Promise.allSettled([
      preloadRouteComponents(route),
      client.query({
        query: GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
        variables,
        fetchPolicy: 'cache-first',
      }),
    ]);
  };

  return { prefetchChannelDiscussionList };
};
