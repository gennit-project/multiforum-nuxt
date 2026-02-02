import { useMutation } from '@vue/apollo-composable';
import type { Ref, ComputedRef } from 'vue';
import {
  GET_CLOSED_ISSUES_BY_CHANNEL,
  GET_ISSUES_BY_CHANNEL,
} from '@/graphQLData/issue/queries';
import { CLOSE_ISSUE, REOPEN_ISSUE } from '@/graphQLData/issue/mutations';
import {
  COUNT_CLOSED_ISSUES,
  COUNT_OPEN_ISSUES,
} from '@/graphQLData/mod/queries';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  LockedBy?: { displayName?: string };
};

type UseIssueCloseReopenParams = {
  activeIssueId: Ref<string> | ComputedRef<string>;
  activeIssue: Ref<Issue | null> | ComputedRef<Issue | null>;
  channelId: Ref<string> | ComputedRef<string>;
};

export function useIssueCloseReopen({
  activeIssueId,
  activeIssue,
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

        if (
          existingClosedIssuesData &&
          // @ts-ignore
          existingClosedIssuesData.issuesAggregate
        ) {
          // @ts-ignore
          const existingClosedIssues = existingClosedIssuesData.issuesAggregate;
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

        if (
          existingOpenIssuesData &&
          // @ts-ignore
          existingOpenIssuesData.issuesAggregate
        ) {
          // @ts-ignore
          const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
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

        // Also update the result of GET_ISSUES_BY_CHANNEL
        // to remove this issue from the list of open issues
        const existingIssuesByChannelData: any = cache.readQuery({
          query: GET_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value, searchInput: '' },
        });

        if (existingIssuesByChannelData?.channels) {
          const existingIssuesByChannel =
            existingIssuesByChannelData.channels[0];
          const newIssuesByChannel = {
            ...existingIssuesByChannel,
            Issues: existingIssuesByChannel.Issues.filter(
              (issue: Issue) => issue.id !== activeIssueId.value
            ),
          };

          cache.writeQuery({
            query: GET_ISSUES_BY_CHANNEL,
            variables: { channelUniqueName: channelId.value, searchInput: '' },
            data: {
              channels: [newIssuesByChannel],
            },
          });
        }

        // Also update the result of GET_CLOSED_ISSUES_BY_CHANNEL
        // to add this issue to the list of closed issues
        const existingClosedIssuesByChannelData: {
          channels?: { Issues: Issue[] }[];
        } | null = cache.readQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
        });

        if (
          existingClosedIssuesByChannelData &&
          // @ts-ignore
          existingClosedIssuesByChannelData.channels
        ) {
          // @ts-ignore
          const existingClosedIssuesByChannel =
            existingClosedIssuesByChannelData.channels[0];
          const newClosedIssuesByChannel = {
            ...existingClosedIssuesByChannel,
            Issues: [
              ...(existingClosedIssuesByChannel?.Issues || []),
              activeIssue.value,
            ],
          };

          cache.writeQuery({
            query: GET_CLOSED_ISSUES_BY_CHANNEL,
            variables: { channelUniqueName: channelId.value },
            data: {
              channels: [newClosedIssuesByChannel],
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

        if (
          existingClosedIssuesData &&
          // @ts-ignore
          existingClosedIssuesData.issuesAggregate
        ) {
          // @ts-ignore
          const existingClosedIssues = existingClosedIssuesData.issuesAggregate;
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

        if (
          existingOpenIssuesData &&
          // @ts-ignore
          existingOpenIssuesData.issuesAggregate
        ) {
          // @ts-ignore
          const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
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

        // Also update the result of GET_CLOSED_ISSUES_BY_CHANNEL
        // so that the newly reopened issue is removed from the list
        // of closed issues.
        const existingClosedIssuesByChannelData: {
          channels?: { Issues: Issue[] }[];
        } | null = cache.readQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
        });

        if (
          existingClosedIssuesByChannelData &&
          // @ts-ignore
          existingClosedIssuesByChannelData.channels
        ) {
          // @ts-ignore
          const existingClosedIssuesByChannel =
            existingClosedIssuesByChannelData.channels[0];
          const newClosedIssuesByChannel = {
            ...existingClosedIssuesByChannel,
            Issues: (existingClosedIssuesByChannel?.Issues || []).filter(
              (issue: Issue) => issue.id !== activeIssueId.value
            ),
          };

          cache.writeQuery({
            query: GET_CLOSED_ISSUES_BY_CHANNEL,
            variables: { channelUniqueName: channelId.value },
            data: {
              channels: [newClosedIssuesByChannel],
            },
          });
        }

        // Also update the result of GET_ISSUES_BY_CHANNEL
        // to add this issue to the list of open issues
        const existingIssuesByChannelData: any = cache.readQuery({
          query: GET_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value, searchInput: '' },
        });

        if (existingIssuesByChannelData?.channels) {
          const existingIssuesByChannel =
            existingIssuesByChannelData.channels[0];
          const newIssuesByChannel = {
            ...existingIssuesByChannel,
            Issues: [...existingIssuesByChannel.Issues, activeIssue.value],
          };

          cache.writeQuery({
            query: GET_ISSUES_BY_CHANNEL,
            variables: { channelUniqueName: channelId.value, searchInput: '' },
            data: {
              channels: [newIssuesByChannel],
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
