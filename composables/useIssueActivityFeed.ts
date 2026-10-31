import { computed, ref } from 'vue';
import { useMutation, type UseQueryReturn } from '@vue/apollo-composable';
import type { ComputedRef, Ref } from 'vue';
import type { ApolloCache, NormalizedCacheObject, FetchResult } from '@apollo/client/core';
import { GetIssueActivityDocument as GET_ISSUE_ACTIVITY, AddIssueActivityFeedItemDocument as ADD_ISSUE_ACTIVITY_FEED_ITEM, AddIssueActivityFeedItemWithCommentAsModDocument as ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD, AddIssueActivityFeedItemWithCommentAsUserDocument as ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER  } from '@/__generated__/operations';
import type { IssueView as Issue, IssueActivityItem as ModerationAction } from '@/types/Issue';

import type { GetIssueActivityQuery, GetIssueActivityQueryVariables, AddIssueActivityFeedItemMutation } from '@/__generated__/operations';

const DEFAULT_ACTIVITY_FEED_PAGE_SIZE = 10;

type ActivityQuery = UseQueryReturn<GetIssueActivityQuery, GetIssueActivityQueryVariables>;
export type FetchMoreIssue = ActivityQuery['fetchMore'];
type OnIssueResult = ActivityQuery['onResult'];

type UseIssueActivityFeedParams = {
  channelId: Ref<string>;
  activityFeedLimit?: number;
  // Pagination wiring (optional: the mutation helpers work without it).
  issueNumber?: Ref<number | null>;
  activeIssue?: Ref<Issue | null> | ComputedRef<Issue | null>;
  getIssueLoading?: Ref<boolean>;
  fetchMoreIssue?: FetchMoreIssue;
  refetchIssue?: () => Promise<unknown> | undefined;
  onIssueResult?: OnIssueResult;
};

export function useIssueActivityFeed({
  channelId,
  activityFeedLimit,
  issueNumber,
  activeIssue,
  getIssueLoading,
  fetchMoreIssue,
  refetchIssue,
  onIssueResult,
}: UseIssueActivityFeedParams) {
  const pageSize = activityFeedLimit ?? DEFAULT_ACTIVITY_FEED_PAGE_SIZE;

  const lastActivityFeedBatchSize = ref(pageSize);

  const activityFeedItems = computed<ModerationAction[]>(
    () => activeIssue?.value?.ActivityFeed ?? []
  );

  onIssueResult?.((result) => {
    const issue = result.data?.issues?.[0];
    if (!issue) {
      return;
    }
    const loaded = issue.ActivityFeed.length;
    const total = issue.ActivityFeedConnection?.aggregate?.count?.nodes;
    lastActivityFeedBatchSize.value = typeof total === 'number'
      ? (loaded < total ? pageSize : 0)
      : loaded;
  });

  const hasMoreActivityFeed = computed(() => {
    const total = activeIssue?.value?.ActivityFeedConnection?.aggregate?.count?.nodes;
    return typeof total === 'number'
      ? activityFeedItems.value.length < total
      : lastActivityFeedBatchSize.value === pageSize;
  });

  const loadMoreActivityFeed = async () => {
    if (
      !fetchMoreIssue ||
      getIssueLoading?.value ||
      !hasMoreActivityFeed.value
    ) {
      return;
    }

    const previousCount = activityFeedItems.value.length;
    const requestedIssue = activeIssue?.value?.id;
    const requestedChannel = channelId.value;
    const requestedNumber = issueNumber?.value;
    const result = await fetchMoreIssue({
      variables: {
        channelUniqueName: channelId.value,
        issueNumber: issueNumber?.value ?? 0,
        activityFeedLimit: pageSize,
        activityFeedOffset: previousCount,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const prevIssue = previousResult.issues?.[0];
        const nextIssue = fetchMoreResult?.issues?.[0];
        if (!prevIssue || !nextIssue || prevIssue.id !== nextIssue.id || requestedIssue !== activeIssue?.value?.id || requestedChannel !== channelId.value || requestedNumber !== issueNumber?.value) {
          return previousResult;
        }

        const prevFeed = prevIssue.ActivityFeed ?? [];
        const nextFeed = nextIssue.ActivityFeed ?? [];

        return {
          ...previousResult,
          issues: [
            {
              ...prevIssue,
              ActivityFeed: [...new Map([...prevFeed, ...nextFeed].map((item) => [item.id, item])).values()],
            },
          ],
        };
      },
    });

    if (requestedIssue !== activeIssue?.value?.id || requestedChannel !== channelId.value || requestedNumber !== issueNumber?.value) return;
    const newCount =
      result?.data?.issues?.[0]?.ActivityFeed?.length ?? previousCount;
    lastActivityFeedBatchSize.value = Math.max(newCount - previousCount, 0);
  };

  const resetActivityFeed = async () => {
    lastActivityFeedBatchSize.value = pageSize;
    await refetchIssue?.();
  };

  const createCacheUpdater = () => ({
    update: (
      cache: ApolloCache<NormalizedCacheObject>,
      { data }: FetchResult<AddIssueActivityFeedItemMutation>
    ) => {
      if (!data?.addIssueActivityFeedItem?.issues) return;

      const { issues } = data.addIssueActivityFeedItem;
      const updatedIssue = issues[0];
      if (!updatedIssue) return;

      // Attempt to read the existing issues from the cache
      const variables: GetIssueActivityQueryVariables = {
        channelUniqueName: updatedIssue.channelUniqueName || '',
        issueNumber: updatedIssue.issueNumber,
      };

      if (typeof activityFeedLimit === 'number') {
        variables.activityFeedLimit = activityFeedLimit;
        variables.activityFeedOffset = 0;
      }

      const existingIssueData = cache.readQuery({
        query: GET_ISSUE_ACTIVITY,
        variables,
      });

      if (existingIssueData?.issues && existingIssueData.issues.length > 0) {
        const existingIssues = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? {
            ...issue,
            // The mutation returns the entire history. Keep the visible window
            // already loaded for this query, rather than expanding it implicitly.
            ActivityFeed: typeof activityFeedLimit === 'number'
              ? updatedIssue.ActivityFeed.slice(0, Math.max(pageSize, issue.ActivityFeed.length))
              : updatedIssue.ActivityFeed,
            ActivityFeedConnection: updatedIssue.ActivityFeedConnection,
          } : issue
        );

        cache.writeQuery({
          query: GET_ISSUE_ACTIVITY,
          variables,
          data: {
            issues: newIssues,
          },
        });
      }
    },
  });

  const { mutate: addIssueActivityFeedItem } = useMutation(
    ADD_ISSUE_ACTIVITY_FEED_ITEM,
    createCacheUpdater()
  );

  const {
    mutate: addIssueActivityFeedItemWithCommentAsMod,
    loading: addIssueActivityFeedItemWithCommentAsModLoading,
    error: addIssueActivityFeedItemWithCommentAsModError,
  } = useMutation(
    ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
    createCacheUpdater()
  );

  const {
    mutate: addIssueActivityFeedItemWithCommentAsUser,
    loading: addIssueActivityFeedItemWithCommentAsUserLoading,
    error: addIssueActivityFeedItemWithCommentAsUserError,
  } = useMutation(
    ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER,
    createCacheUpdater()
  );

  return {
    addIssueActivityFeedItem,
    addIssueActivityFeedItemWithCommentAsMod,
    addIssueActivityFeedItemWithCommentAsModLoading,
    addIssueActivityFeedItemWithCommentAsModError,
    addIssueActivityFeedItemWithCommentAsUser,
    addIssueActivityFeedItemWithCommentAsUserLoading,
    addIssueActivityFeedItemWithCommentAsUserError,
    // Pagination
    activityFeedItems,
    hasMoreActivityFeed,
    loadMoreActivityFeed,
    resetActivityFeed,
  };
}
