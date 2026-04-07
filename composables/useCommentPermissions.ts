import { computed, type Ref, type ComputedRef } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { USER_IS_MOD_OR_OWNER_IN_CHANNEL } from '@/graphQLData/user/queries';
import { usernameVar, modProfileNameVar } from '@/cache';
import type { PermissionFlags } from '@/utils/permissionUtils';
import { config } from '@/config';
import { useResolvedModPermissions } from '@/composables/useResolvedModPermissions';

type UseCommentPermissionsReturn = {
  userPermissions: ComputedRef<PermissionFlags>;
  loading: ComputedRef<boolean>;
};

/**
 * Composable that handles permission-related queries and computed properties for comments.
 * Fetches channel data, server config, and user mod status to compute permissions.
 *
 * @param forumId - Reactive ref containing the forum/channel unique name
 * @returns Object containing userPermissions computed ref and loading state
 */
export function useCommentPermissions(
  forumId: Ref<string> | ComputedRef<string>
): UseCommentPermissionsReturn {
  // Fetch channel data for mod roles
  const { result: getChannelResult, loading: channelLoading } = useQuery(
    GET_CHANNEL,
    () => ({
      uniqueName: forumId.value,
      now: DateTime.local().startOf('hour').toISO(),
    }),
    {
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-first',
    }
  );

  // Fetch server config for fallback mod roles
  const { result: getServerResult, loading: serverLoading } = useQuery(
    GET_SERVER_CONFIG,
    {
      serverName: config.serverName,
    },
    {
      fetchPolicy: 'cache-first',
    }
  );

  // Fetch user's mod/owner status in the channel
  const { result: getPermissionResult, loading: permissionLoading } = useQuery(
    USER_IS_MOD_OR_OWNER_IN_CHANNEL,
    () => ({
      modDisplayName: modProfileNameVar.value,
      username: usernameVar.value,
      channelUniqueName: forumId.value || '',
    }),
    {
      enabled: computed(
        () =>
          !!modProfileNameVar.value &&
          !!usernameVar.value &&
          !!forumId.value
      ),
      fetchPolicy: 'cache-first',
    }
  );

  const channelData = computed(() => getChannelResult.value?.channels?.[0] ?? null);
  const serverConfig = computed(
    () => getServerResult.value?.serverConfigs?.[0] ?? null
  );
  const permissionData = computed(
    () => getPermissionResult.value?.channels?.[0] ?? null
  );

  const { userPermissions } = useResolvedModPermissions({
    channelData,
    serverConfig,
    permissionData,
    username: computed(() => usernameVar.value),
    modProfileName: computed(() => modProfileNameVar.value),
  });

  // Combined loading state
  const loading = computed(
    () =>
      channelLoading.value || serverLoading.value || permissionLoading.value
  );

  return {
    userPermissions,
    loading,
  };
}
