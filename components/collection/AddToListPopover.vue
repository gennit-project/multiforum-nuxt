<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { usernameVar } from '@/cache';
import { useToastStore } from '@/stores/toastStore';
import type { CollectionVisibility, Collection } from '@/__generated__/graphql';
import { useCollectionMutations } from '@/composables/useCollectionMutations';
import { useCollectionQueries } from '@/composables/useCollectionQueries';
import {
  usePopoverPositioning,
  type PopoverPosition,
} from '@/composables/usePopoverPositioning';

// Type for item types that can be added to collections
type ItemType = 'discussion' | 'comment' | 'image' | 'channel' | 'download';

// Type for items that can be in a collection (union of possible types)
type CollectionItem = { id?: string; uniqueName?: string };

// Type for collection objects used in this component
type CollectionListItem = Pick<Collection, 'id' | 'name'>;

const props = defineProps({
  itemId: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
    validator: (value: string) =>
      ['discussion', 'comment', 'image', 'channel', 'download'].includes(value),
  },
  isVisible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object as PropType<PopoverPosition>,
    default: () => ({ top: 0, left: 0 }),
  },
  isAlreadyFavorite: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String as PropType<'popover' | 'modal'>,
    default: 'popover',
  },
});

const emit = defineEmits<{
  close: [];
}>();

const popoverRef = ref<HTMLElement | null>(null);
const searchTerm = ref('');
const isCreatingNew = ref(false);
const newCollectionName = ref('');
const isLoading = ref(false);
const toastStore = useToastStore();

// Use composables
const { collectionType, getCollectionQuery, getCheckItemQuery } =
  useCollectionQueries(props.itemType as ItemType);
const {
  createCollection,
  getAddMutation,
  getRemoveMutation,
  getAddFavoriteMutation,
  getRemoveFavoriteMutation,
} = useCollectionMutations(props.itemType as ItemType);

// Fetch user collections
// Use cache-and-network to prevent cache collision with itemInCollections query
const { result: collectionsResult, refetch: refetchCollections } = useQuery(
  getCollectionQuery(),
  () => ({
    username: usernameVar.value,
    searchTerm: searchTerm.value || undefined,
  }),
  () => ({
    enabled: !!usernameVar.value && props.isVisible,
    fetchPolicy: 'cache-and-network',
  })
);

// Check which collections already contain this item
// Use network-only to get fresh data and avoid cache conflicts with main collections query
const { result: itemInCollectionsResult, refetch: refetchItemInCollections } =
  useQuery(
    getCheckItemQuery(),
    () => ({
      username: usernameVar.value,
      itemId: props.itemId,
      collectionType: collectionType,
    }),
    () => ({
      enabled: !!usernameVar.value && props.isVisible,
      fetchPolicy: 'network-only',
    })
  );

const collections = computed(() => {
  return collectionsResult.value?.users?.[0]?.Collections || [];
});

const favoritesList = computed(() => {
  const defaultFavorites = {
    id: `favorites-${props.itemType || 'items'}`,
    name: 'Favorites',
    items: [],
  };

  const user = collectionsResult.value?.users?.[0];
  if (!user) return defaultFavorites;

  switch (props.itemType) {
    case 'discussion':
      return {
        id: 'favorites-discussions',
        name: 'Favorites',
        items: user.FavoriteDiscussions || [],
      };
    case 'comment':
      return {
        id: 'favorites-comments',
        name: 'Favorites',
        items: user.FavoriteComments || [],
      };
    case 'image':
      return {
        id: 'favorites-images',
        name: 'Favorites',
        items: user.FavoriteImages || [],
      };
    case 'channel':
      return {
        id: 'favorites-channels',
        name: 'Favorites',
        items: user.FavoriteChannels || [],
      };
    case 'download':
      return {
        id: 'favorites-downloads',
        name: 'Favorites',
        items: user.FavoriteDiscussions || [],
      };
    default:
      return defaultFavorites;
  }
});

const itemInCollections = computed(() => {
  return itemInCollectionsResult.value?.users?.[0]?.Collections || [];
});

const isItemInFavorites = computed(() => {
  // If it's already favorited (from the button state), show it as checked
  if (props.isAlreadyFavorite) return true;

  // Otherwise check if it's in the favorites list from the query
  if (props.itemType === 'channel') {
    // Channels use uniqueName instead of id
    return (
      favoritesList.value?.items?.some(
        (item: CollectionItem) => item.uniqueName === props.itemId
      ) || false
    );
  } else {
    // Other item types use id
    return (
      favoritesList.value?.items?.some(
        (item: CollectionItem) => item.id === props.itemId
      ) || false
    );
  }
});

const filteredCollections = computed(() => {
  if (!searchTerm.value) return collections.value;
  return collections.value.filter((collection: Pick<Collection, 'name'>) =>
    collection.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Use positioning composable
const positionRef = computed(() => props.position);
const isVisibleRef = computed(() => props.isVisible);
const { adjustedPosition } = usePopoverPositioning({
  popoverRef,
  position: positionRef,
  isVisible: isVisibleRef,
  contentDependencies: [filteredCollections, isCreatingNew, isLoading],
});

const isModal = computed(() => props.variant === 'modal');

// Search functionality
watch(searchTerm, () => {
  if (usernameVar.value && props.isVisible) {
    refetchCollections();
  }
});

const handleCreateNewCollection = async () => {
  if (!newCollectionName.value.trim()) return;

  if (!usernameVar.value) return;

  isLoading.value = true;
  try {
    const now = new Date().toISOString();
    const result = await createCollection({
      name: newCollectionName.value.trim(),
      collectionType,
      visibility: 'PUBLIC' as CollectionVisibility,
      updatedAt: now,
      username: usernameVar.value,
    });

    if (result?.data?.createCollections?.collections?.[0]) {
      const newCollection = result.data.createCollections.collections[0];

      // Add the item to the newly created collection
      const addMutation = getAddMutation();
      await addMutation({
        collectionId: newCollection.id,
        itemId: props.itemId,
      });

      toastStore.showToast(`Added to "${newCollection.name}"`);
      refetchCollections();
      refetchItemInCollections();
      newCollectionName.value = '';
      isCreatingNew.value = false;
    }
  } catch (error) {
    console.error('Error creating collection:', error);
    toastStore.showToast('Error creating collection', 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleToggleInCollection = async (collection: CollectionListItem) => {
  // Check if this is the favorites list (has an id starting with 'favorites-')
  if (collection.id && collection.id.startsWith('favorites-')) {
    // Handle favorites list
    const isCurrentlyFavorited = isItemInFavorites.value;

    isLoading.value = true;
    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const removeMutation = getRemoveFavoriteMutation();
        const params =
          props.itemType === 'channel'
            ? { channel: props.itemId, username: usernameVar.value }
            : props.itemType === 'download'
              ? { discussionId: props.itemId, username: usernameVar.value }
              : {
                  [`${props.itemType}Id`]: props.itemId,
                  username: usernameVar.value,
                };

        await removeMutation(params);
        toastStore.showToast(`Removed from "${collection.name}"`);
      } else {
        // Add to favorites
        const addMutation = getAddFavoriteMutation();
        const params =
          props.itemType === 'channel'
            ? { channel: props.itemId, username: usernameVar.value }
            : props.itemType === 'download'
              ? { discussionId: props.itemId, username: usernameVar.value }
              : {
                  [`${props.itemType}Id`]: props.itemId,
                  username: usernameVar.value,
                };

        await addMutation(params);
        toastStore.showToast(`Added to "${collection.name}"`);
      }

      // Refresh the data
      refetchCollections();
    } catch (error) {
      console.error('Error toggling favorites:', error);
      toastStore.showToast('Error updating favorites', 'error');
    } finally {
      isLoading.value = false;
    }
  } else {
    // Handle regular collections
    const isInCollection = itemInCollections.value.some(
      (c: CollectionListItem) => c.id === collection.id
    );

    isLoading.value = true;
    try {
      if (isInCollection) {
        const removeMutation = getRemoveMutation();
        await removeMutation({
          collectionId: collection.id,
          itemId: props.itemId,
        });
        toastStore.showToast(`Removed from "${collection.name}"`);
      } else {
        const addMutation = getAddMutation();
        await addMutation({
          collectionId: collection.id,
          itemId: props.itemId,
        });
        toastStore.showToast(`Added to "${collection.name}"`);
      }

      // Refresh the data
      refetchCollections();
      refetchItemInCollections();
    } catch (error) {
      console.error('Error toggling collection:', error);
      toastStore.showToast('Error updating collection', 'error');
    } finally {
      isLoading.value = false;
    }
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (isModal.value) return;

  const target = event.target as HTMLElement;
  // Don't close if clicking inside the popover or the button that triggered it
  if (
    !target.closest('.add-to-list-popover') &&
    !target.closest('.add-to-favorites-button')
  ) {
    emit('close');
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isVisible) {
    emit('close');
  }
};

onMounted(() => {
  // Use setTimeout to avoid immediate closure on the same click that opened it
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});

const popoverClasses = computed(() => {
  return [
    'add-to-list-popover z-[9999] w-80 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4',
    isModal.value ? 'relative' : 'fixed',
  ]
    .filter(Boolean)
    .join(' ');
});

const popoverStyles = computed(() => {
  if (isModal.value) return {};

  return {
    top: `${adjustedPosition.value.top}px`,
    left: `${adjustedPosition.value.left}px`,
  };
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible && isModal"
      class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4"
      @click="emit('close')"
    >
      <div ref="popoverRef" :class="popoverClasses" @click.stop>
        <!-- Header -->
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">
            Add to List
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <!-- Search Bar -->
        <div class="mb-3">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search lists..."
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          >
        </div>

        <!-- Create New List -->
        <div class="mb-3">
          <div v-if="!isCreatingNew">
            <button
              class="hover:bg-blue-50 flex w-full items-center rounded-md px-3 py-2 text-sm text-blue-600 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
              @click="isCreatingNew = true"
            >
              <span class="mr-2">+</span>
              New List
            </button>
          </div>
          <div v-else class="space-y-2">
            <input
              v-model="newCollectionName"
              type="text"
              placeholder="Enter list name..."
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              @keyup.enter="handleCreateNewCollection"
              @keyup.escape="isCreatingNew = false"
            >
            <div class="flex gap-2">
              <button
                class="flex-1 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="!newCollectionName.trim() || isLoading"
                @click="handleCreateNewCollection"
              >
                Create
              </button>
              <button
                class="hover:bg-gray-50 flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="
                  isCreatingNew = false;
                  newCollectionName = '';
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <hr class="mb-3 border-gray-200 dark:border-gray-600" >

        <!-- Lists -->
        <div class="max-h-64 space-y-1 overflow-y-auto">
          <!-- Favorites List (Always shown) -->
          <div
            class="hover:bg-gray-50 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm dark:hover:bg-gray-700"
            @click.stop="handleToggleInCollection(favoritesList)"
          >
            <div class="flex items-center">
              <span class="mr-2 text-yellow-500">★</span>
              <span class="text-gray-900 dark:text-white">{{
                favoritesList.name
              }}</span>
            </div>
            <input
              type="checkbox"
              :checked="isItemInFavorites"
              class="rounded text-blue-600 focus:ring-blue-500"
              readonly
            >
          </div>

          <!-- Divider between Favorites and Collections -->
          <div
            v-if="
              favoritesList &&
              (!searchTerm || filteredCollections.length > 0 || !searchTerm)
            "
            class="my-2"
          >
            <hr class="border-gray-200 dark:border-gray-600" >
            <div
              class="mb-1 mt-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Collections
            </div>
          </div>

          <!-- Custom Collections -->
          <div
            v-for="collection in filteredCollections"
            :key="collection.id"
            class="hover:bg-gray-50 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm dark:hover:bg-gray-700"
            @click.stop="handleToggleInCollection(collection)"
          >
            <div class="flex items-center">
              <span class="text-gray-900 dark:text-white">{{
                collection.name
              }}</span>
              <span class="ml-2 text-xs text-gray-500"
                >({{ collection.itemCount }})</span
              >
            </div>
            <input
              type="checkbox"
              :checked="
                itemInCollections.some(
                  (c: CollectionListItem) => c.id === collection.id
                )
              "
              class="rounded text-blue-600 focus:ring-blue-500"
              readonly
            >
          </div>

          <!-- No Search Results -->
          <div
            v-if="filteredCollections.length === 0 && searchTerm"
            class="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No collections found for "{{ searchTerm }}"
          </div>

          <!-- Empty Collections State -->
          <div
            v-if="filteredCollections.length === 0 && !searchTerm"
            class="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No collections yet. Create your first collection above!
          </div>
        </div>

        <!-- Loading Overlay -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50 dark:bg-gray-800/50"
        >
          <div
            class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"
          />
        </div>
      </div>
    </div>
    <div
      v-else-if="isVisible"
      ref="popoverRef"
      :class="popoverClasses"
      :style="popoverStyles"
      @click.stop
    >
      <!-- Header -->
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Add to List
        </h3>
        <button
          aria-label="Close"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-3">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search lists..."
          aria-label="Search lists"
          class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        >
      </div>

      <!-- Create New List -->
      <div class="mb-3">
        <div v-if="!isCreatingNew">
          <button
            class="hover:bg-blue-50 flex w-full items-center rounded-md px-3 py-2 text-sm text-blue-600 transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
            @click="isCreatingNew = true"
          >
            <span class="mr-2">+</span>
            New List
          </button>
        </div>
        <div v-else class="space-y-2">
          <input
            v-model="newCollectionName"
            type="text"
            placeholder="Enter list name..."
            aria-label="New list name"
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            @keyup.enter="handleCreateNewCollection"
            @keyup.escape="isCreatingNew = false"
          >
          <div class="flex gap-2">
            <button
              class="flex-1 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="!newCollectionName.trim() || isLoading"
              @click="handleCreateNewCollection"
            >
              Create
            </button>
            <button
              class="hover:bg-gray-50 flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="
                isCreatingNew = false;
                newCollectionName = '';
              "
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="mb-3 border-gray-200 dark:border-gray-600" >

      <!-- Lists -->
      <div class="max-h-64 space-y-1 overflow-y-auto">
        <!-- Favorites List (Always shown) -->
        <div
          class="hover:bg-gray-50 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm dark:hover:bg-gray-700"
          @click.stop="handleToggleInCollection(favoritesList)"
        >
          <div class="flex items-center">
            <span class="mr-2 text-yellow-500">★</span>
            <span class="text-gray-900 dark:text-white">{{
              favoritesList.name
            }}</span>
          </div>
          <input
            type="checkbox"
            :checked="isItemInFavorites"
            :aria-label="`${isItemInFavorites ? 'Remove from' : 'Add to'} ${favoritesList.name}`"
            class="rounded text-blue-600 focus:ring-blue-500"
            readonly
          >
        </div>

        <!-- Divider between Favorites and Collections -->
        <div
          v-if="
            favoritesList &&
            (!searchTerm || filteredCollections.length > 0 || !searchTerm)
          "
          class="my-2"
        >
          <hr class="border-gray-200 dark:border-gray-600" >
          <div
            class="mb-1 mt-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Collections
          </div>
        </div>

        <!-- Custom Collections -->
        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          class="hover:bg-gray-50 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm dark:hover:bg-gray-700"
          @click.stop="handleToggleInCollection(collection)"
        >
          <div class="flex items-center">
            <span class="text-gray-900 dark:text-white">{{
              collection.name
            }}</span>
            <span class="ml-2 text-xs text-gray-500"
              >({{ collection.itemCount }})</span
            >
          </div>
          <input
            type="checkbox"
            :checked="
              itemInCollections.some(
                (c: CollectionListItem) => c.id === collection.id
              )
            "
            :aria-label="`${itemInCollections.some((c: CollectionListItem) => c.id === collection.id) ? 'Remove from' : 'Add to'} ${collection.name}`"
            class="rounded text-blue-600 focus:ring-blue-500"
            readonly
          >
        </div>

        <!-- No Search Results -->
        <div
          v-if="filteredCollections.length === 0 && searchTerm"
          class="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No collections found for "{{ searchTerm }}"
        </div>

        <!-- Empty Collections State -->
        <div
          v-if="filteredCollections.length === 0 && !searchTerm"
          class="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No collections yet. Create your first collection above!
        </div>
      </div>

      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50 dark:bg-gray-800/50"
      >
        <div
          class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.add-to-list-popover {
  min-width: 320px;
}
</style>
