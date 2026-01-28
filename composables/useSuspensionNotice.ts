import { computed, type Ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GET_USER_ACTIVE_SUSPENSIONS,
  GET_USER_SUSPENSION_IN_CHANNEL,
} from '@/graphQLData/user/queries';
import { usernameVar } from '@/cache';

type ChannelSuspension = {
  suspendedUntil?: string | null;
  suspendedIndefinitely?: boolean | null;
  RelatedIssue?: { issueNumber?: number | null } | null;
};

type ServerSuspension = ChannelSuspension & {
  channelUniqueName?: string | null;
};

export const useChannelSuspensionNotice = (
  channelUniqueName: Ref<string> | string
) => {
  const channelId = computed(() =>
    typeof channelUniqueName === 'string'
      ? channelUniqueName
      : channelUniqueName.value
  );

  const { result } = useQuery(
    GET_USER_SUSPENSION_IN_CHANNEL,
    () => ({
      channelUniqueName: channelId.value,
      username: usernameVar.value,
    }),
    () => ({
      enabled: !!channelId.value && !!usernameVar.value,
      fetchPolicy: 'cache-first',
    })
  );

  const activeSuspension = computed<ChannelSuspension | null>(() => {
    return result.value?.channels?.[0]?.SuspendedUsers?.[0] || null;
  });

  return {
    activeSuspension,
    issueNumber: computed(
      () => activeSuspension.value?.RelatedIssue?.issueNumber ?? null
    ),
    suspendedUntil: computed(
      () => activeSuspension.value?.suspendedUntil ?? null
    ),
    suspendedIndefinitely: computed(
      () => activeSuspension.value?.suspendedIndefinitely ?? false
    ),
    channelId,
  };
};

export const useServerSuspensionNotice = () => {
  const nowIso = new Date().toISOString();

  const { result } = useQuery(
    GET_USER_ACTIVE_SUSPENSIONS,
    () => ({
      username: usernameVar.value,
      now: nowIso,
    }),
    () => ({
      enabled: !!usernameVar.value,
      fetchPolicy: 'cache-first',
    })
  );

  const activeSuspension = computed<ServerSuspension | null>(() => {
    return result.value?.users?.[0]?.Suspensions?.[0] || null;
  });

  return {
    activeSuspension,
    issueNumber: computed(
      () => activeSuspension.value?.RelatedIssue?.issueNumber ?? null
    ),
    suspendedUntil: computed(
      () => activeSuspension.value?.suspendedUntil ?? null
    ),
    suspendedIndefinitely: computed(
      () => activeSuspension.value?.suspendedIndefinitely ?? false
    ),
    channelId: computed(() => activeSuspension.value?.channelUniqueName ?? ''),
  };
};
