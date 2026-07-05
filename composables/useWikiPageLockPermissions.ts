import { computed, type ComputedRef, type Ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { useModProfileName, useUsername } from '@/composables/useAuthState';
import { useResolvedModPermissions } from '@/composables/useResolvedModPermissions';
import { config } from '@/config';
import type { PermissionData, Role } from '@/utils/permissionUtils';

type MaybeComputed<T> = Ref<T> | ComputedRef<T>;

type ChannelWithWikiLockRoles = PermissionData & {
  DefaultModRole?: Role | null;
  ElevatedModRole?: Role | null;
  Moderators?: Array<{ displayName?: string | null }> | null;
  SuspendedMods?: Array<{ modProfileName?: string | null }> | null;
  SuspendedUsers?: Array<{ username?: string | null }> | null;
  Admins?: Array<{ username?: string | null }> | null;
};

export function useWikiPageLockPermissions(
  channel: MaybeComputed<unknown>
) {
  const username = useUsername();
  const modProfileName = useModProfileName();

  const { result: serverConfigResult, loading: serverConfigLoading } = useQuery(
    GET_SERVER_CONFIG,
    { serverName: config.serverName },
    { fetchPolicy: 'cache-first' }
  );

  const serverConfig = computed(
    () => serverConfigResult.value?.serverConfigs?.[0] ?? null
  );
  const normalizedChannel = computed(() => {
    const value = channel.value as ChannelWithWikiLockRoles | null;
    if (!value) return null;

    return {
      ...value,
      Admins: (value.Admins || [])
        .map((admin) => ({ username: admin.username || '' }))
        .filter((admin) => !!admin.username),
      Moderators: (value.Moderators || [])
        .map((mod) => ({ displayName: mod.displayName || '' }))
        .filter((mod) => !!mod.displayName),
      SuspendedMods: (value.SuspendedMods || [])
        .map((mod) => ({ modProfileName: mod.modProfileName || '' }))
        .filter((mod) => !!mod.modProfileName),
      SuspendedUsers: (value.SuspendedUsers || [])
        .map((user) => ({ username: user.username || '' }))
        .filter((user) => !!user.username),
    };
  });

  const { userPermissions } = useResolvedModPermissions({
    channelData: normalizedChannel,
    serverConfig,
    username,
    modProfileName,
  });

  return {
    canManageWikiPageLock: computed(() => userPermissions.value.canDeleteWiki),
    loading: serverConfigLoading,
  };
}
