import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetServerConfigDocument as GET_SERVER_CONFIG } from '@/__generated__/operations';

import { config } from '@/config';

export const useServerRoleMembership = () => {
  const { result } = useQuery(
    GET_SERVER_CONFIG,
    {
      serverName: config.serverName,
    },
    {
      fetchPolicy: 'cache-first',
    }
  );

  const serverAdminUsernames = computed(() => {
    return (
      result.value?.serverConfigs?.[0]?.Admins?.map(
        (admin: { username: string }) => admin.username
      ) || []
    );
  });

  // Server moderators are identified by mod-profile name only; see
  // useForumRoleMembership for why usernames are never matched.
  const serverModProfileNames = computed(() => {
    return (
      result.value?.serverConfigs?.[0]?.Moderators?.map(
        (moderator: { displayName?: string | null }) => moderator.displayName
      ).filter((value): value is string => typeof value === 'string' && value.length > 0) || []
    );
  });

  return {
    serverAdminUsernames,
    serverModProfileNames,
  };
};
