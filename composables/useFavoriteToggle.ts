import { ref, type Ref } from 'vue';
import { useUsername } from '@/composables/useAuthState';
import { useToastStore } from '@/stores/toastStore';
import {
  useAddToListModalStore,
  type AllowedItemType,
} from '@/stores/addToListModalStore';

type MutateFn<TVariables> = (
  variables: TVariables
) => Promise<unknown> | undefined;

type UseFavoriteToggleParams<TVariables> = {
  /** The optimistic favorited state, owned by the calling component. */
  isFavorited: Ref<boolean>;
  /** Identifier of the item being favorited (reactive getter). */
  itemId: () => string;
  /** Item type used for the "Organize" modal (reactive getter). */
  entityType: () => AllowedItemType;
  /** Whether to offer the "Organize" action on the added toast. */
  allowAddToList: () => boolean;
  /** Toast message shown when the item is added to favorites. */
  addedMessage: () => string;
  /** Toast message shown when the item is removed from favorites. */
  removedMessage: () => string;
  /** Apollo mutate function for adding the favorite. */
  addFavorite: MutateFn<TVariables>;
  /** Apollo mutate function for removing the favorite. */
  removeFavorite: MutateFn<TVariables>;
  /** Build the exact variables selected by the caller's typed mutation. */
  variables: (itemId: string, username: string) => TVariables;
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
export function useFavoriteToggle<TVariables>(
  params: UseFavoriteToggleParams<TVariables>
) {
  const isLoading = ref(false);
  const usernameVar = useUsername();
  const toastStore = useToastStore();

  const showAddedToast = (itemId: string, itemType: AllowedItemType) => {
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
          itemId,
          itemType,
          isAlreadyFavorite: true,
        }),
    });
  };

  const handleToggleFavorite = async () => {
    if (!usernameVar.value || isLoading.value) return;

    const itemId = params.itemId();
    const username = usernameVar.value;
    const itemType = params.entityType();
    const isCurrent = () =>
      itemId === params.itemId() &&
      username === usernameVar.value &&
      itemType === params.entityType();

    // Optimistic update - toggle immediately
    params.isFavorited.value = !params.isFavorited.value;
    isLoading.value = true;

    const variables = params.variables(itemId, username);

    try {
      if (!params.isFavorited.value) {
        await params.removeFavorite(variables);
        if (!isCurrent()) return;
        toastStore.showToast(params.removedMessage());
      } else {
        await params.addFavorite(variables);
        if (!isCurrent()) return;
        showAddedToast(itemId, itemType);
      }
      params.onAfterToggle?.();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (!isCurrent()) return;
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
