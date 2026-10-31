import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  GetUserCommentsDocument,
  GetGeneralNotificationsDocument,
  UpdateEventsDocument,
  GetEventsSourcef3f666cbeeDocument,
} from '@/__generated__/operations';
import type { CommentView } from '@/types/Comment';

export function checkProfileEventContracts() {
  const summaries = useQuery(GetUserCommentsDocument, {
    username: 'alice',
    limit: 25,
    offset: 0,
  });
  const notifications = useQuery(GetGeneralNotificationsDocument, {
    username: 'alice',
  });
  const events = useQuery(GetEventsSourcef3f666cbeeDocument, { limit: 25 });
  const mutation = useMutation(UpdateEventsDocument);
  // @ts-expect-error raw route arrays must be narrowed to one username
  summaries.refetch({ username: ['alice'], limit: 25, offset: 0 });
  // @ts-expect-error profile summaries do not select the interactive renderer fields
  const comment: CommentView | undefined =
    summaries.result.value?.users[0]?.Comments[0];
  const scratchpad = notifications.result.value?.users[0]?.Notifications[0]?.ScratchpadEntry;
  // @ts-expect-error notifications do not select a full scratchpad owner
  void scratchpad?.Owner;
  // @ts-expect-error event list channels do not select channel comment counts
  void events.result.value?.events[0]?.EventChannels[0]?.CommentsConnection;
  mutation.mutate({
    where: { id: { eq: 'e1' } },
    // @ts-expect-error scalar update inputs require generated mutation wrappers
    updateEventInput: { canceled: true },
    channelConnections: [],
    channelDisconnections: [],
  });
  return comment;
}
