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
  forumModProfileNames: ComputedRef<string[]>;
};

type MaybeRefString = string | Ref<string> | ComputedRef<string>;
type MaybeRefBoolean = boolean | Ref<boolean> | ComputedRef<boolean>;

const forumRoleMembershipKey: InjectionKey<ForumRoleMembership> = Symbol(
  'forumRoleMembership'
);

const defaultForumRoleMembership: ForumRoleMembership = {
  forumAdminUsernames: computed(() => []),
  forumModProfileNames: computed(() => []),
};

export const createForumRoleMembership = (
  channelUniqueName: MaybeRefString,
  prefetch: MaybeRefBoolean = true
): ForumRoleMembership => {
  const { result } = useQuery(
    GET_MODS_BY_CHANNEL,
    () => ({
      channelUniqueName: unref(channelUniqueName),
    }),
    () => ({
      fetchPolicy: 'cache-first',
      enabled: !!unref(channelUniqueName),
      prefetch: unref(prefetch),
    })
  );

  const forumAdminUsernames = computed(() => {
    return (
      result.value?.channels?.[0]?.Admins?.map(
        (admin: { username: string }) => admin.username
      ) || []
    );
  });

  // Moderators are identified by mod-profile name only. The backend denies
  // ModerationProfile.User, so the account behind a profile is never known,
  // and matching a regular username would link the two publicly.
  const forumModProfileNames = computed(() => {
    return (
      result.value?.channels?.[0]?.Moderators?.map(
        (moderator: { displayName?: string | null }) => moderator.displayName
      ).filter(Boolean) || []
    );
  });

  return {
    forumAdminUsernames,
    forumModProfileNames,
  };
};

export const provideForumRoleMembership = (
  channelUniqueName: MaybeRefString,
  prefetch: MaybeRefBoolean = true
) => {
  const membership = createForumRoleMembership(channelUniqueName, prefetch);
  provide(forumRoleMembershipKey, membership);
  return membership;
};

export const useForumRoleMembership = (): ForumRoleMembership => {
  return inject(forumRoleMembershipKey, defaultForumRoleMembership);
};
