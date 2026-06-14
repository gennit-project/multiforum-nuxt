import { ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useToast } from './useToast';
import { isAuthenticatedVar } from '@/cache';

type UseAutoUnsubscribeParams = {
  /** The entity ID (discussion channel ID, event channel ID, etc.) */
  entityId: Ref<string | null | undefined>;
  /** The unsubscribe mutation function */
  unsubscribeFn: (entityId: string) => Promise<unknown>;
  /** The entity type for the toast message */
  entityType: 'discussion' | 'event' | 'issue' | 'comment';
  /** Whether the user is currently subscribed */
  isSubscribed: Ref<boolean>;
};

/**
 * Composable to handle ?action=unsubscribe query parameter.
 * Automatically unsubscribes the user when they visit a URL with this param.
 */
export function useAutoUnsubscribe(params: UseAutoUnsubscribeParams) {
  const { entityId, unsubscribeFn, entityType, isSubscribed } = params;

  const route = useRoute();
  const router = useRouter();
  const { success, info } = useToast();

  const hasHandledUnsubscribe = ref(false);
  const isProcessing = ref(false);

  const processUnsubscribeAction = async () => {
    // Only process once per page load
    if (hasHandledUnsubscribe.value || isProcessing.value) return;

    // Check if action=unsubscribe is in query params
    if (route.query.action !== 'unsubscribe') return;

    // Must be authenticated
    if (!isAuthenticatedVar.value) {
      // Remove the query param but don't show error - user will see login prompt
      await removeActionParam();
      return;
    }

    // Must have entity ID
    const id = entityId.value;
    if (!id) return;

    isProcessing.value = true;
    hasHandledUnsubscribe.value = true;

    try {
      // Only unsubscribe if currently subscribed
      if (isSubscribed.value) {
        await unsubscribeFn(id);
        success(`You have been unsubscribed from this ${entityType}.`);
      } else {
        info(`You are not subscribed to this ${entityType}.`);
      }
    } catch (error) {
      console.error('Error processing unsubscribe action:', error);
    } finally {
      isProcessing.value = false;
      await removeActionParam();
    }
  };

  const removeActionParam = async () => {
    // Remove the action query param from URL
    const newQuery = { ...route.query };
    delete newQuery.action;
    await router.replace({ query: newQuery });
  };

  // Watch for changes to entityId and isSubscribed to process the action
  // This handles cases where data loads asynchronously
  watch(
    [entityId, isSubscribed],
    () => {
      if (entityId.value && route.query.action === 'unsubscribe') {
        processUnsubscribeAction();
      }
    },
    { immediate: true }
  );

  return {
    isProcessing,
    hasHandledUnsubscribe,
  };
}
