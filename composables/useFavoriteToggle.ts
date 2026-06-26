import { ref, type Ref } from 'vue';
import { useUsername } from '@/composables/useAuthState';
import { useToastStore } from '@/stores/toastStore';
import {
  useAddToListModalStore,
  type AllowedItemType,
} from '@/stores/addToListModalStore';

type MutateFn = (
  variables: Record<string, unknown>
) => Promise<unknown> | undefined;

type UseFavoriteToggleParams = {
  /** The optimistic favorited state, owned by the calling component. */
  isFavorited: Ref<boolean>;
  /** Identifier of the item being favorited (reactive getter). */
  itemId: () => string;
  /** Item type used for the "Organize" modal (reactive getter). */
  entityType: () => string;
  /** Whether to offer the "Organize" action on the added toast. */
  allowAddToList: () => boolean;
  /** Toast message shown when the item is added to favorites. */
  addedMessage: () => string;
  /** Toast message shown when the item is removed from favorites. */
  removedMessage: () => string;
  /** Apollo mutate function for adding the favorite. */
  addFavorite: MutateFn;
  /** Apollo mutate function for removing the favorite. */
  removeFavorite: MutateFn;
  /** Key used for the item id in the mutation variables (e.g. "discussionId"). */
  mutationItemKey: string;
  /** Optional hook run after a successful toggle (e.g. refetch the lookup query). */
  onAfterToggle?: () => void;
};

/**
 * Shared favorite-toggle behavior for the AddTo*Favorites button components.
 *
 * Owns the loading state and the optimistic add/remove flow (toggle eagerly,
 * call the mutation, surface a toast, revert on error). Each component keeps its
 * own query and `isFavorited` derivation since those differ per entity, and
 * passes the entity-specific mutations, variable key, and messages in here.
 */
export function useFavoriteToggle(params: UseFavoriteToggleParams) {
  const isLoading = ref(false);
  const usernameVar = useUsername();
  const toastStore = useToastStore();

  const showAddedToast = () => {
    const message = params.addedMessage();

    if (!params.allowAddToList()) {
      toastStore.showToast(message);
      return;
    }

    toastStore.showToast(message, 'success', {
      label: 'Organize',
      // Resolve the modal store lazily so components that never offer the
      // "Organize" action don't need it provided in their test environment.
      onClick: () =>
        useAddToListModalStore().open({
          itemId: params.itemId(),
          itemType: params.entityType() as AllowedItemType,
          isAlreadyFavorite: true,
        }),
    });
  };

  const handleToggleFavorite = async () => {
    if (!usernameVar.value) return;

    // Optimistic update - toggle immediately
    params.isFavorited.value = !params.isFavorited.value;
    isLoading.value = true;

    const variables = {
      [params.mutationItemKey]: params.itemId(),
      username: usernameVar.value,
    };

    try {
      if (!params.isFavorited.value) {
        await params.removeFavorite(variables);
        toastStore.showToast(params.removedMessage());
      } else {
        await params.addFavorite(variables);
        showAddedToast();
      }
      params.onAfterToggle?.();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      params.isFavorited.value = !params.isFavorited.value;
      toastStore.showToast(
        'Error updating favorites. Please try again.',
        'error'
      );
    } finally {
      isLoading.value = false;
    }
  };

  return { isLoading, handleToggleFavorite };
}
