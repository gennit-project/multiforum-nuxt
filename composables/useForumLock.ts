import { computed, type Ref } from 'vue';
import { DateTime } from 'luxon';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';

// Shared copy for the "creation blocked because the forum is locked" notice, so
// every create surface (discussions, events, comments) shows the same message.
export const FORUM_LOCKED_MESSAGE =
  'This forum is locked. New discussions, events, and comments cannot be created until a moderator unlocks it.';

// Channel (forum) lock state, for gating content-creation affordances in the UI.
//
// A locked forum is frozen: the backend rejects new discussions, events, and
// comments (see rules/permission/hasChannelPermission on the server). This
// composable surfaces the matching front-end signals — hide create links, block
// submit, and explain why — from a single source of truth.
//
// Reads GET_CHANNEL cache-first with the same variables the forum layout
// (pages/forums/[forumId].vue) already fetches, so it reuses that result instead
// of issuing a second network request.
export const useForumLock = (channelUniqueName: Ref<string> | string) => {
  const channelId = computed(() =>
    typeof channelUniqueName === 'string'
      ? channelUniqueName
      : channelUniqueName.value
  );

  const { result } = useQuery(
    GET_CHANNEL,
    () => ({
      uniqueName: channelId.value,
      // Match the forum layout's variables so this hits the same cache entry.
      now: DateTime.utc().startOf('hour').toISO(),
    }),
    {
      fetchPolicy: 'cache-first',
      enabled: computed(() => !!channelId.value),
    }
  );

  const channel = computed(() => result.value?.channels?.[0] ?? null);
  const locked = computed(() => channel.value?.locked === true);
  const lockReason = computed(() => channel.value?.lockReason ?? null);

  // A ready-made message for forms to display when creation is blocked.
  const lockError = computed(() =>
    locked.value ? FORUM_LOCKED_MESSAGE : null
  );

  return { locked, lockReason, lockError, channel };
};
