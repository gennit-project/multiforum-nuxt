import { computed, unref, type MaybeRef } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GetDiscussionAgeGateCheckDocument as GET_DISCUSSION_AGE_GATE_CHECK,
  GetDiscussionIdByNumberDocument as GET_DISCUSSION_ID_BY_NUMBER,
} from '@/__generated__/operations';

type UseDiscussionAgeGateCheckParams = {
  /** The global id, when the caller already has it. */
  discussionId?: MaybeRef<string>;
  /**
   * Route-style identity (forum + per-forum number), used to look the global
   * id up when `discussionId` is not known. A discussion the page could not
   * load is exactly the case where only the route's number is available.
   */
  discussionNumber?: MaybeRef<number | null>;
  channelUniqueName?: MaybeRef<string>;
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
  discussionNumber,
  channelUniqueName,
  enabled,
}: UseDiscussionAgeGateCheckParams) {
  const needsLookup = computed(
    () =>
      !unref(discussionId) &&
      unref(discussionNumber) != null &&
      Boolean(unref(channelUniqueName))
  );
  const { result: lookupResult, loading: lookupLoading } = useQuery(
    GET_DISCUSSION_ID_BY_NUMBER,
    () => ({
      channelUniqueName: unref(channelUniqueName) ?? '',
      discussionNumber: unref(discussionNumber) ?? 0,
    }),
    () => ({ enabled: unref(enabled) && needsLookup.value })
  );
  const resolvedDiscussionId = computed(
    () =>
      unref(discussionId) ||
      lookupResult.value?.discussionChannels?.[0]?.discussionId ||
      ''
  );

  const { result, loading: checkLoading } = useQuery(
    GET_DISCUSSION_AGE_GATE_CHECK,
    () => ({ discussionId: resolvedDiscussionId.value }),
    () => ({ enabled: unref(enabled) && Boolean(resolvedDiscussionId.value) })
  );

  const check = computed(() => result.value?.getDiscussionAgeGateCheck ?? null);
  const requiresAgeCheck = computed(
    () => check.value?.requiresAgeCheck === true
  );
  // Stay loading between the id lookup finishing and the check starting.
  const loading = computed(
    () =>
      lookupLoading.value ||
      checkLoading.value ||
      (needsLookup.value &&
        !lookupResult.value &&
        unref(enabled) &&
        !resolvedDiscussionId.value)
  );

  return { check, requiresAgeCheck, loading };
}
