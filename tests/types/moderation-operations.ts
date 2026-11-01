import { useMutation, useQuery } from '@vue/apollo-composable';
import {
  CreateIssueDocument,
  GetIssueDocument,
  GetIssueActivityDocument,
  UpdateIssueDocument,
  GetPendingChannelModsByChannelDocument,
} from '../../__generated__/operations';

export function checkModerationSelections() {
  const issue = useQuery(GetIssueDocument, { channelUniqueName: 'cats', issueNumber: 1 });
  const feed = useQuery(GetIssueActivityDocument, { channelUniqueName: 'cats', issueNumber: 1 });
  const invites = useQuery(GetPendingChannelModsByChannelDocument, { channelUniqueName: 'cats' });
  const edit = useMutation(UpdateIssueDocument);
  // @ts-expect-error route values must be narrowed to a scalar number
  issue.refetch({ channelUniqueName: 'cats', issueNumber: ['1'] });
  // @ts-expect-error the summary query does not select the activity feed
  void issue.result.value?.issues[0]?.ActivityFeed;
  // @ts-expect-error activity paging does not select the issue title
  void feed.result.value?.issues[0]?.title;
  // @ts-expect-error pending mod invitations do not select avatar data
  void invites.result.value?.channels[0]?.PendingModInvites[0]?.profilePicURL;
  // @ts-expect-error the pinned schema requires scalar update operators
  edit.mutate({ issueWhere: { id: { eq: 'i1' } }, updateIssueInput: { body: 'text' } });
  edit.mutate({ issueWhere: { id: { eq: 'i1' } }, updateIssueInput: { body: { set: 'text' } } });
  return { issue, feed, invites, edit };
}

export function checkIssueCreationInput() {
  const create = useMutation(CreateIssueDocument);
  create.mutate({ input: { title: 'Request', body: 'Details' } });
  create.mutate({ input: { title: 'Request', body: 'Details', channelUniqueName: 'cats', asModerationProfile: true } });
  // @ts-expect-error identity and numbering are server assigned
  create.mutate({ input: { title: 'Request', body: 'Details', issueNumber: 1 } });
  // @ts-expect-error caller cannot supply author relationships
  create.mutate({ input: { title: 'Request', body: 'Details', Author: {} } });
  // @ts-expect-error body is required
  create.mutate({ input: { title: 'Request' } });
  // @ts-expect-error moderation persona is a boolean context selection
  create.mutate({ input: { title: 'Request', body: 'Details', asModerationProfile: 'other-mod' } });
}
