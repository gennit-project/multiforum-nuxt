import { useMutation } from '@vue/apollo-composable';
import type { Ref } from 'vue';
import { GET_ISSUE } from '@/graphQLData/issue/queries';
import {
  ADD_ISSUE_ACTIVITY_FEED_ITEM,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER,
} from '@/graphQLData/issue/mutations';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  LockedBy?: { displayName?: string };
};

type UseIssueActivityFeedParams = {
  channelId: Ref<string>;
};

export function useIssueActivityFeed({ channelId }: UseIssueActivityFeedParams) {
  const createCacheUpdater = () => ({
    // @ts-ignore - Apollo cache update typing is complex
    update: (cache: any, { data }: any) => {
      if (!data?.updateIssues?.issues) return;

      const { issues } = data.updateIssues;
      const updatedIssue: Issue = issues[0];
      if (!updatedIssue) return;

      // Attempt to read the existing issues from the cache
      const existingIssueData = cache.readQuery({
        query: GET_ISSUE,
        variables: {
          channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
          issueNumber: updatedIssue.issueNumber,
        },
      });

      if (existingIssueData?.issues?.length > 0) {
        const existingIssues: Issue[] = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );

        cache.writeQuery({
          query: GET_ISSUE,
          variables: {
            channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
            issueNumber: updatedIssue.issueNumber,
          },
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
  };
}
