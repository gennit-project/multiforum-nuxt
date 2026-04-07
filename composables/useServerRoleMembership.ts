import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
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

  const serverModUsernames = computed(() => {
    return (
      result.value?.serverConfigs?.[0]?.Moderators?.map(
        (moderator: {
          User?: { username?: string | null } | null;
        }) => moderator.User?.username
      ).filter(Boolean) || []
    );
  });

  const serverModProfileNames = computed(() => {
    return (
      result.value?.serverConfigs?.[0]?.Moderators?.map(
        (moderator: { displayName?: string | null }) => moderator.displayName
      ).filter(Boolean) || []
    );
  });

  return {
    serverAdminUsernames,
    serverModUsernames,
    serverModProfileNames,
  };
};
