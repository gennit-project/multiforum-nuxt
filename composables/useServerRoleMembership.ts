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

  // Server moderators are identified by mod-profile name only; see
  // useForumRoleMembership for why usernames are never matched.
  const serverModProfileNames = computed(() => {
    return (
      result.value?.serverConfigs?.[0]?.Moderators?.map(
        (moderator: { displayName?: string | null }) => moderator.displayName
      ).filter(Boolean) || []
    );
  });

  return {
    serverAdminUsernames,
    serverModProfileNames,
  };
};
