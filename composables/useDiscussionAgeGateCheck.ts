import { computed, unref, type MaybeRef } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import type { AgeGateCheck } from '@/__generated__/graphql';
import { GET_DISCUSSION_AGE_GATE_CHECK } from '@/graphQLData/age/queries';

type UseDiscussionAgeGateCheckParams = {
  discussionId: MaybeRef<string>;
  /** Only ask when the page couldn't load the discussion. */
  enabled: MaybeRef<boolean>;
};

/**
 * Whether a discussion (or download) the page couldn't load is behind the
 * sensitive-content age gate, so the page can say so instead of "not found"
 * or "deleted". Components using the same discussion id share one request.
 */
export function useDiscussionAgeGateCheck({
  discussionId,
  enabled,
}: UseDiscussionAgeGateCheckParams) {
  const { result, loading } = useQuery<{
    getDiscussionAgeGateCheck: AgeGateCheck;
  }>(
    GET_DISCUSSION_AGE_GATE_CHECK,
    () => ({ discussionId: unref(discussionId) }),
    () => ({ enabled: unref(enabled) && Boolean(unref(discussionId)) })
  );

  const check = computed(() => result.value?.getDiscussionAgeGateCheck ?? null);
  const requiresAgeCheck = computed(
    () => check.value?.requiresAgeCheck === true
  );

  return { check, requiresAgeCheck, loading };
}
