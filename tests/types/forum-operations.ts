import { useQuery, useMutation } from '@vue/apollo-composable';
import { GetSortedChannelsDiscussionsDocument, GetChannelDocument, GetPublicScratchpadEntriesDocument, SetChannelDiscussionFlairConfigDocument } from '../../__generated__/operations';

export function checkForumContracts() {
  // @ts-expect-error runtime timestamps are variables, never interpolated defaults
  useQuery(GetSortedChannelsDiscussionsDocument, { limit: 25 });
  const channel = useQuery(GetChannelDocument, { uniqueName: 'cats' });
  // @ts-expect-error selected channel has no full schema creation metadata
  void channel.result.value?.channels[0]?.createdAt;
  const kudos = useQuery(GetPublicScratchpadEntriesDocument, { username: 'alice', limit: 10 });
  // @ts-expect-error scratchpad authors are nullable
  void kudos.result.value?.scratchpadEntries[0]?.Author.username;
  const update = useMutation(SetChannelDiscussionFlairConfigDocument);
  // @ts-expect-error order is a required Int, not an absent map lookup
  void update.mutate({ channelUniqueName: 'cats', flairRequired: false, flairs: [{ displayName: 'Question', order: undefined }] });
}
