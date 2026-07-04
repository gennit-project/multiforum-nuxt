import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { ComputedRef, Ref } from 'vue';
import type { ApolloCache, NormalizedCacheObject } from '@apollo/client/core';
import { GET_ISSUE } from '@/graphQLData/issue/queries';
import {
  ADD_ISSUE_ACTIVITY_FEED_ITEM,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER,
} from '@/graphQLData/issue/mutations';
import type { Issue, ModerationAction } from '@/__generated__/graphql';

const DEFAULT_ACTIVITY_FEED_PAGE_SIZE = 10;

type IssueFeedData = { issues?: Issue[] | null };

// Narrow views of the Apollo query handles the pagination needs. Typed loosely
// enough that GET_ISSUE's inferred handles assign cleanly while still
// describing the shape the merge logic relies on.
export type FetchMoreIssue = (options: {
  variables: {
    channelUniqueName: string;
    issueNumber: number | null;
    activityFeedLimit: number;
    activityFeedOffset: number;
  };
  updateQuery: (
    previousResult: { issues: Issue[] },
    options: { fetchMoreResult?: { issues?: Issue[] } | null }
  ) => { issues: Issue[] };
}) => Promise<{ data?: IssueFeedData } | null | undefined> | undefined;

type OnIssueResult = (
  cb: (result: { data?: IssueFeedData | null }) => void
) => unknown;

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
    lastActivityFeedBatchSize.value = issue.ActivityFeed?.length ?? 0;
  });

  const hasMoreActivityFeed = computed(
    () => lastActivityFeedBatchSize.value === pageSize
  );

  const loadMoreActivityFeed = async () => {
    if (!fetchMoreIssue || getIssueLoading?.value || !hasMoreActivityFeed.value) {
      return;
    }

    const previousCount = activityFeedItems.value.length;
    const result = await fetchMoreIssue({
      variables: {
        channelUniqueName: channelId.value,
        issueNumber: issueNumber?.value ?? null,
        activityFeedLimit: pageSize,
        activityFeedOffset: previousCount,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const prevIssue = previousResult.issues?.[0];
        const nextIssue = fetchMoreResult?.issues?.[0];
        if (!prevIssue || !nextIssue) {
          return previousResult;
        }

        const prevFeed = prevIssue.ActivityFeed ?? [];
        const nextFeed = nextIssue.ActivityFeed ?? [];

        return {
          ...previousResult,
          issues: [
            {
              ...prevIssue,
              ActivityFeed: [...prevFeed, ...nextFeed],
            },
          ],
        };
      },
    });

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
      { data }: { data?: { updateIssues?: { issues: Issue[] } } | null }
    ) => {
      if (!data?.updateIssues?.issues) return;

      const { issues } = data.updateIssues;
      const updatedIssue = issues[0] as Issue | undefined;
      if (!updatedIssue) return;

      // Attempt to read the existing issues from the cache
      const variables: Record<string, unknown> = {
        channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
        issueNumber: updatedIssue.issueNumber,
      };

      if (typeof activityFeedLimit === 'number') {
        variables.activityFeedLimit = activityFeedLimit;
        variables.activityFeedOffset = 0;
      }

      const existingIssueData = cache.readQuery<{ issues: Issue[] }>({
        query: GET_ISSUE,
        variables,
      });

      if (existingIssueData?.issues && existingIssueData.issues.length > 0) {
        const existingIssues: Issue[] = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );

        cache.writeQuery({
          query: GET_ISSUE,
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
