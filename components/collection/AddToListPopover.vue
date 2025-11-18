<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { PropType } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { usernameVar } from '@/cache';
import { useToastStore } from '@/stores/toastStore';
import type {
  CollectionType,
  CollectionVisibility,
} from '@/__generated__/graphql';
import {
  GET_USER_COLLECTIONS_DISCUSSIONS,
  GET_USER_COLLECTIONS_COMMENTS,
  GET_USER_COLLECTIONS_IMAGES,
  GET_USER_COLLECTIONS_CHANNELS,
  GET_USER_COLLECTIONS_DOWNLOADS,
  CHECK_ITEM_IN_COLLECTIONS,
} from '@/graphQLData/collection/queries';
import {
  CREATE_COLLECTION,
  ADD_DISCUSSION_TO_COLLECTION,
  ADD_COMMENT_TO_COLLECTION,
  ADD_IMAGE_TO_COLLECTION,
  ADD_CHANNEL_TO_COLLECTION,
  ADD_DOWNLOAD_TO_COLLECTION,
  REMOVE_DISCUSSION_FROM_COLLECTION,
  REMOVE_COMMENT_FROM_COLLECTION,
  REMOVE_IMAGE_FROM_COLLECTION,
  REMOVE_CHANNEL_FROM_COLLECTION,
  REMOVE_DOWNLOAD_FROM_COLLECTION,
} from '@/graphQLData/collection/mutations';
import {
  ADD_FAVORITE_DISCUSSION,
  REMOVE_FAVORITE_DISCUSSION,
  ADD_FAVORITE_COMMENT,
  REMOVE_FAVORITE_COMMENT,
  ADD_FAVORITE_IMAGE,
  REMOVE_FAVORITE_IMAGE,
  ADD_FAVORITE_CHANNEL,
  REMOVE_FAVORITE_CHANNEL,
} from '@/graphQLData/user/mutations';

type PopoverPosition = {
  top: number;
  left: number;
  placement?: 'above' | 'below';
  triggerRect?: {
    top: number;
    bottom: number;
    height: number;
    width: number;
  };
};

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
const adjustedPosition = ref({
  top: props.position?.top || 0,
  left: props.position?.left || 0,
});

// Map frontend item types to GraphQL enum values
const collectionTypeMap: Record<string, CollectionType> = {
  discussion: 'DISCUSSIONS' as CollectionType,
  comment: 'COMMENTS' as CollectionType,
  image: 'IMAGES' as CollectionType,
  channel: 'CHANNELS' as CollectionType,
  download: 'DOWNLOADS' as CollectionType,
};

const collectionType = computed(() => collectionTypeMap[props.itemType]);

// Select the appropriate query based on item type
const getCollectionQuery = () => {
  switch (props.itemType) {
    case 'discussion':
      return GET_USER_COLLECTIONS_DISCUSSIONS;
    case 'comment':
      return GET_USER_COLLECTIONS_COMMENTS;
    case 'image':
      return GET_USER_COLLECTIONS_IMAGES;
    case 'channel':
      return GET_USER_COLLECTIONS_CHANNELS;
    case 'download':
      return GET_USER_COLLECTIONS_DOWNLOADS;
    default:
      return GET_USER_COLLECTIONS_DISCUSSIONS;
  }
};

// Fetch user collections
const { result: collectionsResult, refetch: refetchCollections } = useQuery(
  getCollectionQuery(),
  () => ({
    username: usernameVar.value,
    searchTerm: searchTerm.value || undefined,
  }),
  () => ({
    enabled: !!usernameVar.value && props.isVisible,
  })
);

// Check which collections already contain this item
const { result: itemInCollectionsResult } = useQuery(
  CHECK_ITEM_IN_COLLECTIONS,
  () => ({
    username: usernameVar.value,
    itemId: props.itemId,
    collectionType: collectionType.value,
  }),
  () => ({
    enabled: !!usernameVar.value && props.isVisible,
  })
);

const collections = computed(() => {
  return collectionsResult.value?.users?.[0]?.Collections || [];
});

const favoritesList = computed(() => {
  const user = collectionsResult.value?.users?.[0];
  if (!user) return {
    id: 'favorites',
    name: 'Favorites',
    items: []
  };

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
      return {
        id: 'favorites',
        name: 'Favorites',
        items: []
      };
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
        (item: any) => item.uniqueName === props.itemId
      ) || false
    );
  } else {
    // Other item types use id
    return (
      favoritesList.value?.items?.some((item: any) => item.id === props.itemId) ||
      false
    );
  }
});

const filteredCollections = computed(() => {
  if (!searchTerm.value) return collections.value;
  return collections.value.filter((collection: any) =>
    collection.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const updateAdjustedPosition = async () => {
  if (typeof window === 'undefined' || !props.isVisible) return;
  await nextTick();
  if (!popoverRef.value) return;

  const popoverRect = popoverRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 12;
  const triggerRect = props.position?.triggerRect;
  const preferredPlacement = props.position?.placement || 'below';

  let left = props.position?.left ?? 0;
  let top = props.position?.top ?? 0;

  const placeBelow = () =>
    (triggerRect?.bottom ?? props.position?.top ?? 0) + 8;
  const placeAbove = () =>
    (triggerRect?.top ?? props.position?.top ?? 0) - popoverRect.height - 8;

  if (triggerRect) {
    if (preferredPlacement === 'above') {
      let candidateTop = placeAbove();
      if (
        candidateTop < padding &&
        placeBelow() + popoverRect.height <= viewportHeight - padding
      ) {
        candidateTop = placeBelow();
      }
      top = candidateTop;
    } else {
      let candidateTop = placeBelow();
      if (
        candidateTop + popoverRect.height > viewportHeight - padding &&
        placeAbove() >= padding
      ) {
        candidateTop = placeAbove();
      }
      top = candidateTop;
    }
  }

  if (top + popoverRect.height > viewportHeight - padding) {
    top = viewportHeight - popoverRect.height - padding;
  }
  if (top < padding) {
    top = padding;
  }

  if (left + popoverRect.width > viewportWidth - padding) {
    left = viewportWidth - popoverRect.width - padding;
  }
  if (left < padding) {
    left = padding;
  }

  adjustedPosition.value = { top, left };
};

const handleViewportChange = () => {
  if (!props.isVisible) return;
  updateAdjustedPosition();
};

// Mutations
const { mutate: createCollection } = useMutation(CREATE_COLLECTION);

const { mutate: addDiscussionToCollection } = useMutation(
  ADD_DISCUSSION_TO_COLLECTION
);
const { mutate: addCommentToCollection } = useMutation(
  ADD_COMMENT_TO_COLLECTION
);
const { mutate: addImageToCollection } = useMutation(ADD_IMAGE_TO_COLLECTION);
const { mutate: addChannelToCollection } = useMutation(
  ADD_CHANNEL_TO_COLLECTION
);
const { mutate: addDownloadToCollection } = useMutation(
  ADD_DOWNLOAD_TO_COLLECTION
);

const { mutate: removeDiscussionFromCollection } = useMutation(
  REMOVE_DISCUSSION_FROM_COLLECTION
);
const { mutate: removeCommentFromCollection } = useMutation(
  REMOVE_COMMENT_FROM_COLLECTION
);
const { mutate: removeImageFromCollection } = useMutation(
  REMOVE_IMAGE_FROM_COLLECTION
);
const { mutate: removeChannelFromCollection } = useMutation(
  REMOVE_CHANNEL_FROM_COLLECTION
);
const { mutate: removeDownloadFromCollection } = useMutation(
  REMOVE_DOWNLOAD_FROM_COLLECTION
);

// Favorites mutations
const { mutate: addFavoriteDiscussion } = useMutation(ADD_FAVORITE_DISCUSSION);
const { mutate: removeFavoriteDiscussion } = useMutation(
  REMOVE_FAVORITE_DISCUSSION
);
const { mutate: addFavoriteComment } = useMutation(ADD_FAVORITE_COMMENT);
const { mutate: removeFavoriteComment } = useMutation(REMOVE_FAVORITE_COMMENT);
const { mutate: addFavoriteImage } = useMutation(ADD_FAVORITE_IMAGE);
const { mutate: removeFavoriteImage } = useMutation(REMOVE_FAVORITE_IMAGE);
const { mutate: addFavoriteChannel } = useMutation(ADD_FAVORITE_CHANNEL);
const { mutate: removeFavoriteChannel } = useMutation(REMOVE_FAVORITE_CHANNEL);

// Search functionality
watch(searchTerm, () => {
  if (usernameVar.value && props.isVisible) {
    refetchCollections();
  }
});

watch(
  () => ({
    top: props.position?.top,
    left: props.position?.left,
    placement: props.position?.placement,
    isVisible: props.isVisible,
  }),
  (state) => {
    if (state.isVisible) {
      updateAdjustedPosition();
    }
  },
  { immediate: true }
);

watch(
  [filteredCollections, () => isCreatingNew.value, () => isLoading.value],
  () => {
    if (props.isVisible) {
      updateAdjustedPosition();
    }
  }
);

const getAddMutation = () => {
  switch (props.itemType) {
    case 'discussion':
      return addDiscussionToCollection;
    case 'comment':
      return addCommentToCollection;
    case 'image':
      return addImageToCollection;
    case 'channel':
      return addChannelToCollection;
    case 'download':
      return addDownloadToCollection;
    default:
      throw new Error(`Unknown item type: ${props.itemType}`);
  }
};

const getRemoveMutation = () => {
  switch (props.itemType) {
    case 'discussion':
      return removeDiscussionFromCollection;
    case 'comment':
      return removeCommentFromCollection;
    case 'image':
      return removeImageFromCollection;
    case 'channel':
      return removeChannelFromCollection;
    case 'download':
      return removeDownloadFromCollection;
    default:
      throw new Error(`Unknown item type: ${props.itemType}`);
  }
};

const getAddFavoriteMutation = () => {
  switch (props.itemType) {
    case 'discussion':
      return addFavoriteDiscussion;
    case 'comment':
      return addFavoriteComment;
    case 'image':
      return addFavoriteImage;
    case 'channel':
      return addFavoriteChannel;
    case 'download':
      return addFavoriteDiscussion; // Downloads use the same mutation as discussions
    default:
      throw new Error(`Unknown item type: ${props.itemType}`);
  }
};

const getRemoveFavoriteMutation = () => {
  switch (props.itemType) {
    case 'discussion':
      return removeFavoriteDiscussion;
    case 'comment':
      return removeFavoriteComment;
    case 'image':
      return removeFavoriteImage;
    case 'channel':
      return removeFavoriteChannel;
    case 'download':
      return removeFavoriteDiscussion; // Downloads use the same mutation as discussions
    default:
      throw new Error(`Unknown item type: ${props.itemType}`);
  }
};

const handleCreateNewCollection = async () => {
  if (!newCollectionName.value.trim()) return;

  isLoading.value = true;
  try {
    const now = new Date().toISOString();
    const result = await createCollection({
      name: newCollectionName.value.trim(),
      collectionType: collectionType.value,
      visibility: 'PUBLIC' as CollectionVisibility,
      updatedAt: now,
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

const handleToggleInCollection = async (collection: any) => {
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
      (c: any) => c.id === collection.id
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
    } catch (error) {
      console.error('Error toggling collection:', error);
      toastStore.showToast('Error updating collection', 'error');
    } finally {
      isLoading.value = false;
    }
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // Don't close if clicking inside the popover or the button that triggered it
  if (
    !target.closest('.add-to-list-popover') &&
    !target.closest('.add-to-favorites-button')
  ) {
    emit('close');
  }
};

onMounted(() => {
  // Use setTimeout to avoid immediate closure on the same click that opened it
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('scroll', handleViewportChange, true);
  }
});

const popoverClasses = computed(() => {
  return 'add-to-list-popover fixed z-[9999] w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4';
});

const popoverStyles = computed(() => {
  return {
    top: `${adjustedPosition.value.top}px`,
    left: `${adjustedPosition.value.left}px`,
  };
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
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
        />
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
          />
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
      <hr class="mb-3 border-gray-200 dark:border-gray-600" />

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
          />
        </div>

        <!-- Divider between Favorites and Collections -->
        <div
          v-if="
            favoritesList &&
            (!searchTerm || filteredCollections.length > 0 || !searchTerm)
          "
          class="my-2"
        >
          <hr class="border-gray-200 dark:border-gray-600" />
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
            <span class="mr-2 text-gray-500">📝</span>
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
              itemInCollections.some((c: any) => c.id === collection.id)
            "
            class="rounded text-blue-600 focus:ring-blue-500"
            readonly
          />
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
