import { computed, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import {
  SUBSCRIBE_TO_ISSUE,
  UNSUBSCRIBE_FROM_ISSUE,
} from '@/graphQLData/issue/mutations';
import { useAutoUnsubscribe } from '@/composables/useAutoUnsubscribe';

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

type IssueLike = {
  id?: string | null;
  SubscribedToNotifications?: ({ username?: string | null } | null)[] | null;
} | null;

type UseIssueSubscriptionParams = {
  activeIssue: MaybeRef<IssueLike>;
  username: MaybeRef<string>;
  // Matches Apollo's refetch, which may return undefined when the query is
  // disabled/skipped.
  refetchIssue: () => Promise<unknown> | undefined;
};

/**
 * Owns the "follow this issue" concern: subscribe/unsubscribe mutations, the
 * one-click ?subscribeCta / ?action=unsubscribe query-param flows, the
 * subscribed-state derivation, and the confirmation toast. Extracted from
 * IssueDetail.vue so the toggle and CTA-dismissal branches are testable without
 * mounting the full issue page.
 */
export function useIssueSubscription({
  activeIssue,
  username,
  refetchIssue,
}: UseIssueSubscriptionParams) {
  const route = useRoute();
  const router = useRouter();

  const showSubscribeCta = ref(route.query.subscribeCta === '1');
  const showIssueSubscriptionNotification = ref(false);
  const issueSubscriptionNotificationTitle = ref('');

  const isIssueSubscribed = computed(() => {
    if (!username.value) return false;
    return Boolean(
      activeIssue.value?.SubscribedToNotifications?.some(
        (user) => user?.username === username.value
      )
    );
  });

  const { mutate: subscribeToIssue, loading: subscribeToIssueLoading } =
    useMutation(SUBSCRIBE_TO_ISSUE);

  const { mutate: unsubscribeFromIssue, loading: unsubscribeFromIssueLoading } =
    useMutation(UNSUBSCRIBE_FROM_ISSUE);

  const clearSubscribeCtaQuery = async () => {
    if (route.query.subscribeCta !== '1') {
      return;
    }

    const nextQuery = { ...route.query };
    delete nextQuery.subscribeCta;
    await router.replace({ query: nextQuery });
  };

  const toggleIssueSubscription = async () => {
    if (!activeIssue.value?.id || !username.value) return;

    if (isIssueSubscribed.value) {
      await unsubscribeFromIssue({ issueId: activeIssue.value.id });
      issueSubscriptionNotificationTitle.value =
        'Unsubscribed from issue updates';
    } else {
      await subscribeToIssue({ issueId: activeIssue.value.id });
      issueSubscriptionNotificationTitle.value = 'Subscribed to issue updates';
    }

    showIssueSubscriptionNotification.value = true;
    showSubscribeCta.value = false;
    await clearSubscribeCtaQuery();
    await refetchIssue();
  };

  const dismissSubscribeCta = async () => {
    showSubscribeCta.value = false;
    await clearSubscribeCtaQuery();
  };

  // Handle ?action=unsubscribe query param for one-click unsubscribe.
  const issueIdRef = computed(() => activeIssue.value?.id || null);
  useAutoUnsubscribe({
    entityId: issueIdRef,
    unsubscribeFn: async (id: string) => {
      await unsubscribeFromIssue({ issueId: id });
    },
    entityType: 'issue',
    isSubscribed: isIssueSubscribed,
  });

  return {
    isIssueSubscribed,
    showSubscribeCta,
    showIssueSubscriptionNotification,
    issueSubscriptionNotificationTitle,
    subscribeToIssueLoading,
    unsubscribeFromIssueLoading,
    toggleIssueSubscription,
    dismissSubscribeCta,
  };
}
