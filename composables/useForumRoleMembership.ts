import {
  computed,
  inject,
  provide,
  unref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_MODS_BY_CHANNEL } from '@/graphQLData/mod/queries';

type ForumRoleMembership = {
  forumAdminUsernames: ComputedRef<string[]>;
  forumModUsernames: ComputedRef<string[]>;
  forumModProfileNames: ComputedRef<string[]>;
};

type MaybeRefString = string | Ref<string> | ComputedRef<string>;

const forumRoleMembershipKey: InjectionKey<ForumRoleMembership> =
  Symbol('forumRoleMembership');

export const createForumRoleMembership = (
  channelUniqueName: MaybeRefString
): ForumRoleMembership => {
  const { result } = useQuery(
    GET_MODS_BY_CHANNEL,
    () => ({
      channelUniqueName: unref(channelUniqueName),
    }),
    () => ({
      fetchPolicy: 'cache-first',
      enabled: !!unref(channelUniqueName),
    })
  );

  const forumAdminUsernames = computed(() => {
    return (
      result.value?.channels?.[0]?.Admins?.map(
        (admin: { username: string }) => admin.username
      ) || []
    );
  });

  const forumModUsernames = computed(() => {
    return (
      result.value?.channels?.[0]?.Moderators?.map(
        (moderator: {
          User?: { username?: string | null } | null;
        }) => moderator.User?.username
      ).filter(Boolean) || []
    );
  });

  const forumModProfileNames = computed(() => {
    return (
      result.value?.channels?.[0]?.Moderators?.map(
        (moderator: { displayName?: string | null }) => moderator.displayName
      ).filter(Boolean) || []
    );
  });

  return {
    forumAdminUsernames,
    forumModUsernames,
    forumModProfileNames,
  };
};

export const provideForumRoleMembership = (
  channelUniqueName: MaybeRefString
) => {
  const membership = createForumRoleMembership(channelUniqueName);
  provide(forumRoleMembershipKey, membership);
  return membership;
};

export const useForumRoleMembership = (): ForumRoleMembership => {
  return (
    inject(forumRoleMembershipKey) || {
      forumAdminUsernames: computed(() => []),
      forumModUsernames: computed(() => []),
      forumModProfileNames: computed(() => []),
    }
  );
};
