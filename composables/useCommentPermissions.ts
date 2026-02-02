import { computed, type Ref, type ComputedRef } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { USER_IS_MOD_OR_OWNER_IN_CHANNEL } from '@/graphQLData/user/queries';
import { usernameVar, modProfileNameVar } from '@/cache';
import { getAllPermissions } from '@/utils/permissionUtils';
import { config } from '@/config';

type UseCommentPermissionsReturn = {
  userPermissions: ComputedRef<Record<string, boolean>>;
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

  // Compute the standard (default) mod role from channel or server config
  const standardModRole = computed(() => {
    if (getChannelResult.value?.channels[0]?.DefaultModRole) {
      return getChannelResult.value.channels[0].DefaultModRole;
    }
    if (getServerResult.value?.serverConfigs[0]?.DefaultModRole) {
      return getServerResult.value.serverConfigs[0].DefaultModRole;
    }
    return null;
  });

  // Compute the elevated mod role from channel or server config
  const elevatedModRole = computed(() => {
    if (getChannelResult.value?.channels[0]?.ElevatedModRole) {
      return getChannelResult.value.channels[0].ElevatedModRole;
    }
    if (getServerResult.value?.serverConfigs[0]?.DefaultElevatedModRole) {
      return getServerResult.value.serverConfigs[0].DefaultElevatedModRole;
    }
    return null;
  });

  // Extract permission data from the channel query
  const permissionData = computed(() => {
    if (getPermissionResult.value?.channels?.[0]) {
      return getPermissionResult.value.channels[0];
    }
    return null;
  });

  // Compute all user permissions using the utility function
  const userPermissions = computed(() => {
    return getAllPermissions({
      permissionData: permissionData.value,
      standardModRole: standardModRole.value,
      elevatedModRole: elevatedModRole.value,
      username: usernameVar.value,
      modProfileName: modProfileNameVar.value,
    });
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
