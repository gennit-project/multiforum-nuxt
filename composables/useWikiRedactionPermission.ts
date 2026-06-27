import { computed, type ComputedRef } from 'vue';
import { DateTime } from 'luxon';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { USER_IS_MOD_OR_OWNER_IN_CHANNEL } from '@/graphQLData/user/queries';
import { useUsername, useModProfileName } from '@/composables/useAuthState';
import { useResolvedModPermissions } from '@/composables/useResolvedModPermissions';
import { config } from '@/config';

type Getter<T> = () => T;

/**
 * Resolves whether the current user may redact (soft-delete) a wiki revision.
 *
 * Mirrors the backend redaction rule: a user is authorized when they authored
 * the revision OR they hold the `canDeleteWiki` permission in the channel
 * (mods with that permission, channel owners/admins, and server admins, all of
 * which resolve through `getAllPermissions`).
 */
export function useWikiRedactionPermission(
  getChannelId: Getter<string | null | undefined>,
  getRevisionAuthor: Getter<string | null | undefined>
): { canRedact: ComputedRef<boolean> } {
  const usernameVar = useUsername();
  const modProfileNameVar = useModProfileName();
  const channelUniqueName = computed(() => getChannelId() || '');

  // Channel + server roles carry the permission booleans; the per-user query
  // tells us which roles apply to this user.
  const { result: channelResult } = useQuery(
    GET_CHANNEL,
    () => ({
      uniqueName: channelUniqueName.value,
      now: DateTime.local().startOf('hour').toISO(),
    }),
    () => ({
      fetchPolicy: 'cache-first',
      enabled: !!channelUniqueName.value,
    })
  );

  const { result: serverResult } = useQuery(
    GET_SERVER_CONFIG,
    { serverName: config.serverName },
    { fetchPolicy: 'cache-first' }
  );

  const { result: permissionResult } = useQuery(
    USER_IS_MOD_OR_OWNER_IN_CHANNEL,
    () => ({
      modDisplayName: modProfileNameVar.value,
      username: usernameVar.value,
      channelUniqueName: channelUniqueName.value,
    }),
    () => ({
      enabled:
        !!usernameVar.value &&
        !!modProfileNameVar.value &&
        !!channelUniqueName.value,
      fetchPolicy: 'cache-first',
    })
  );

  const channelData = computed(() => channelResult.value?.channels?.[0] ?? null);
  const serverConfig = computed(
    () => serverResult.value?.serverConfigs?.[0] ?? null
  );
  const permissionData = computed(
    () => permissionResult.value?.channels?.[0] ?? null
  );

  const { userPermissions } = useResolvedModPermissions({
    channelData,
    serverConfig,
    permissionData,
    username: computed(() => usernameVar.value),
    modProfileName: computed(() => modProfileNameVar.value),
  });

  const isAuthor = computed(() => {
    const username = usernameVar.value;
    const author = getRevisionAuthor();
    return !!username && !!author && username === author;
  });

  const canRedact = computed(
    () => isAuthor.value || !!userPermissions.value.canDeleteWiki
  );

  return { canRedact };
}
