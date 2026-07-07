import { useMutation } from '@vue/apollo-composable';
import type { Ref, ComputedRef } from 'vue';
import { CLOSE_ISSUE, REOPEN_ISSUE } from '@/graphQLData/issue/mutations';
import {
  COUNT_CLOSED_ISSUES,
  COUNT_OPEN_ISSUES,
} from '@/graphQLData/mod/queries';

// Cache query result types
interface IssuesAggregateData {
  issuesAggregate?: { count: number };
}

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
    () => ({
      variables: {
        id: activeIssueId.value,
      },
      update(cache) {
        // Get the issue in the cache by ID, then edit it so the isOpen field is false.
        cache.modify({
          id: cache.identify({
            __typename: 'Issue',
            id: activeIssueId.value,
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
          variables: { channelUniqueName: channelId.value },
        });

        const closedIssuesData = existingClosedIssuesData as IssuesAggregateData | null;
        if (closedIssuesData?.issuesAggregate) {
          const existingClosedIssues = closedIssuesData.issuesAggregate;
          const newClosedIssues = {
            count: existingClosedIssues.count + 1,
          };

          cache.writeQuery({
            query: COUNT_CLOSED_ISSUES,
            variables: { channelUniqueName: channelId.value },
            data: {
              issuesAggregate: newClosedIssues,
            },
          });
        }

        // Also update the result of COUNT_OPEN_ISSUES
        // to decrement the count of open issues
        const existingOpenIssuesData = cache.readQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: channelId.value },
        });

        const openIssuesData = existingOpenIssuesData as IssuesAggregateData | null;
        if (openIssuesData?.issuesAggregate) {
          const existingOpenIssues = openIssuesData.issuesAggregate;
          const newOpenIssues = {
            count: existingOpenIssues.count - 1,
          };

          cache.writeQuery({
            query: COUNT_OPEN_ISSUES,
            variables: { channelUniqueName: channelId.value },
            data: {
              issuesAggregate: newOpenIssues,
            },
          });
        }
      },
    })
  );

  const { mutate: reopenIssue, loading: reopenIssueLoading } = useMutation(
    REOPEN_ISSUE,
    () => ({
      variables: {
        id: activeIssueId.value,
      },
      update(cache) {
        // Get the issue in the cache by ID, then edit it so the isOpen field is true.
        cache.modify({
          id: cache.identify({
            __typename: 'Issue',
            id: activeIssueId.value,
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
          variables: { channelUniqueName: channelId.value },
        });

        const closedIssuesData = existingClosedIssuesData as IssuesAggregateData | null;
        if (closedIssuesData?.issuesAggregate) {
          const existingClosedIssues = closedIssuesData.issuesAggregate;
          const newClosedIssues = {
            count: existingClosedIssues.count - 1,
          };

          cache.writeQuery({
            query: COUNT_CLOSED_ISSUES,
            variables: { channelUniqueName: channelId.value },
            data: {
              issuesAggregate: newClosedIssues,
            },
          });
        }

        // Also update the result of COUNT_OPEN_ISSUES
        // to increment the count of open issues
        const existingOpenIssuesData = cache.readQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: channelId.value },
        });

        const openIssuesData = existingOpenIssuesData as IssuesAggregateData | null;
        if (openIssuesData?.issuesAggregate) {
          const existingOpenIssues = openIssuesData.issuesAggregate;
          const newOpenIssues = {
            count: existingOpenIssues.count + 1,
          };

          cache.writeQuery({
            query: COUNT_OPEN_ISSUES,
            variables: { channelUniqueName: channelId.value },
            data: {
              issuesAggregate: newOpenIssues,
            },
          });
        }
      },
    })
  );

  return {
    closeIssue,
    closeIssueLoading,
    reopenIssue,
    reopenIssueLoading,
  };
}
