import { useMutation } from '@vue/apollo-composable';
import type { Ref, ComputedRef } from 'vue';
import { CloseIssueDocument as CLOSE_ISSUE, ReopenIssueDocument as REOPEN_ISSUE, CountClosedIssuesDocument as COUNT_CLOSED_ISSUES, CountOpenIssuesDocument as COUNT_OPEN_ISSUES  } from '@/__generated__/operations';

type UseIssueCloseReopenParams = {
  activeIssueId: Ref<string> | ComputedRef<string>;
  channelId: Ref<string> | ComputedRef<string>;
};

// The open/closed issue lists render via getSiteWideIssueList with a
// cache-and-network policy, so closing or reopening only needs to flip the
// issue entity's isOpen field and adjust the open/closed count badges; the
// lists refresh on their own when next viewed.
export function useIssueCloseReopen({
  activeIssueId,
  channelId,
}: UseIssueCloseReopenParams) {
  const { mutate: closeIssue, loading: closeIssueLoading } = useMutation(
    CLOSE_ISSUE,
    () => {
      const issueId = activeIssueId.value;
      const forumId = channelId.value;
      let applied = false;
      return {
      variables: {
        id: issueId,
      },
      update(cache) {
        if (applied) return;
        applied = true;
        // Get the issue in the cache by ID, then edit it so the isOpen field is false.
        cache.modify({
          id: cache.identify({
            __typename: 'Issue',
            id: issueId,
          }),
          fields: {
            isOpen() {
              return false;
            },
          },
        });

        // update the result of COUNT_CLOSED_ISSUES
        // to increment the count of closed issues
        const existingClosedIssuesData = cache.readQuery({
          query: COUNT_CLOSED_ISSUES,
          variables: { channelUniqueName: forumId },
        });

        const closedIssuesData = existingClosedIssuesData;
        if (closedIssuesData?.issuesConnection) {
          const existingClosedIssues = closedIssuesData.issuesConnection;
          const newClosedIssues = {
            aggregate: {
              count: { nodes: (existingClosedIssues.aggregate?.count?.nodes ?? 0) + 1 },
            },
          };

          cache.writeQuery({
            query: COUNT_CLOSED_ISSUES,
            variables: { channelUniqueName: forumId },
            data: {
              issuesConnection: newClosedIssues,
            },
          });
        }

        // Also update the result of COUNT_OPEN_ISSUES
        // to decrement the count of open issues
        const existingOpenIssuesData = cache.readQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: forumId },
        });

        const openIssuesData = existingOpenIssuesData;
        if (openIssuesData?.issuesConnection) {
          const existingOpenIssues = openIssuesData.issuesConnection;
          const newOpenIssues = {
            aggregate: {
              count: { nodes: Math.max(0, (existingOpenIssues.aggregate?.count?.nodes ?? 0) - 1) },
            },
          };

          cache.writeQuery({
            query: COUNT_OPEN_ISSUES,
            variables: { channelUniqueName: forumId },
            data: {
              issuesConnection: newOpenIssues,
            },
          });
        }
      },
    };
    }
  );

  const { mutate: reopenIssue, loading: reopenIssueLoading } = useMutation(
    REOPEN_ISSUE,
    () => {
      const issueId = activeIssueId.value;
      const forumId = channelId.value;
      let applied = false;
      return {
      variables: {
        id: issueId,
      },
      update(cache) {
        if (applied) return;
        applied = true;
        // Get the issue in the cache by ID, then edit it so the isOpen field is true.
        cache.modify({
          id: cache.identify({
            __typename: 'Issue',
            id: issueId,
          }),
          fields: {
            isOpen() {
              return true;
            },
          },
        });
        // update the result of COUNT_CLOSED_ISSUES
        // to decrement the count of closed issues
        const existingClosedIssuesData = cache.readQuery({
          query: COUNT_CLOSED_ISSUES,
          variables: { channelUniqueName: forumId },
        });

        const closedIssuesData = existingClosedIssuesData;
        if (closedIssuesData?.issuesConnection) {
          const existingClosedIssues = closedIssuesData.issuesConnection;
          const newClosedIssues = {
            aggregate: {
              count: { nodes: Math.max(0, (existingClosedIssues.aggregate?.count?.nodes ?? 0) - 1) },
            },
          };

          cache.writeQuery({
            query: COUNT_CLOSED_ISSUES,
            variables: { channelUniqueName: forumId },
            data: {
              issuesConnection: newClosedIssues,
            },
          });
        }

        // Also update the result of COUNT_OPEN_ISSUES
        // to increment the count of open issues
        const existingOpenIssuesData = cache.readQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: forumId },
        });

        const openIssuesData = existingOpenIssuesData;
        if (openIssuesData?.issuesConnection) {
          const existingOpenIssues = openIssuesData.issuesConnection;
          const newOpenIssues = {
            aggregate: {
              count: { nodes: (existingOpenIssues.aggregate?.count?.nodes ?? 0) + 1 },
            },
          };

          cache.writeQuery({
            query: COUNT_OPEN_ISSUES,
            variables: { channelUniqueName: forumId },
            data: {
              issuesConnection: newOpenIssues,
            },
          });
        }
      },
    };
    }
  );

  return {
    closeIssue,
    closeIssueLoading,
    reopenIssue,
    reopenIssueLoading,
  };
}
