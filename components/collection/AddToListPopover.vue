<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { usernameVar } from '@/cache';
import { useToastStore } from '@/stores/toastStore';
import type { CollectionType, CollectionVisibility } from '@/__generated__/graphql';
import {
  GET_USER_COLLECTIONS,
  CHECK_ITEM_IN_COLLECTIONS
} from '@/graphQLData/collection/queries';
import {
  CREATE_COLLECTION,
  ADD_DISCUSSION_TO_COLLECTION,
  ADD_COMMENT_TO_COLLECTION,
  ADD_IMAGE_TO_COLLECTION,
  ADD_CHANNEL_TO_COLLECTION,
  REMOVE_DISCUSSION_FROM_COLLECTION,
  REMOVE_COMMENT_FROM_COLLECTION,
  REMOVE_IMAGE_FROM_COLLECTION,
  REMOVE_CHANNEL_FROM_COLLECTION
} from '@/graphQLData/collection/mutations';

const props = defineProps({
  itemId: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
    validator: (value: string) => ['discussion', 'comment', 'image', 'channel'].includes(value),
  },
  isVisible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ top: false, right: false }),
  },
});

const emit = defineEmits<{
  close: [];
}>();

const searchTerm = ref('');
const isCreatingNew = ref(false);
const newCollectionName = ref('');
const isLoading = ref(false);
const toastStore = useToastStore();

// Map frontend item types to GraphQL enum values
const collectionTypeMap: Record<string, CollectionType> = {
  discussion: 'DISCUSSIONS' as CollectionType,
  comment: 'COMMENTS' as CollectionType,
  image: 'IMAGES' as CollectionType,
  channel: 'CHANNELS' as CollectionType,
};

const collectionType = computed(() => collectionTypeMap[props.itemType]);

// Fetch user collections
const { result: collectionsResult, refetch: refetchCollections } = useQuery(
  GET_USER_COLLECTIONS,
  () => ({
    username: usernameVar.value,
    collectionType: collectionType.value,
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
  if (!user) return null;

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
    default:
      return null;
  }
});

const itemInCollections = computed(() => {
  return itemInCollectionsResult.value?.users?.[0]?.Collections || [];
});

const isItemInFavorites = computed(() => {
  return favoritesList.value?.items?.some((item: any) => item.id === props.itemId) || false;
});

// Mutations
const { mutate: createCollection } = useMutation(CREATE_COLLECTION);
const { mutate: addDiscussionToCollection } = useMutation(ADD_DISCUSSION_TO_COLLECTION);
const { mutate: addCommentToCollection } = useMutation(ADD_COMMENT_TO_COLLECTION);
const { mutate: addImageToCollection } = useMutation(ADD_IMAGE_TO_COLLECTION);
const { mutate: addChannelToCollection } = useMutation(ADD_CHANNEL_TO_COLLECTION);
const { mutate: removeDiscussionFromCollection } = useMutation(REMOVE_DISCUSSION_FROM_COLLECTION);
const { mutate: removeCommentFromCollection } = useMutation(REMOVE_COMMENT_FROM_COLLECTION);
const { mutate: removeImageFromCollection } = useMutation(REMOVE_IMAGE_FROM_COLLECTION);
const { mutate: removeChannelFromCollection } = useMutation(REMOVE_CHANNEL_FROM_COLLECTION);

// Search functionality
watch(searchTerm, () => {
  if (usernameVar.value && props.isVisible) {
    refetchCollections();
  }
});

const filteredCollections = computed(() => {
  if (!searchTerm.value) return collections.value;
  return collections.value.filter((collection: any) =>
    collection.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

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
    default:
      throw new Error(`Unknown item type: ${props.itemType}`);
  }
};

const handleCreateNewCollection = async () => {
  if (!newCollectionName.value.trim()) return;

  isLoading.value = true;
  try {
    const result = await createCollection({
      name: newCollectionName.value.trim(),
      collectionType: collectionType.value,
      visibility: 'PUBLIC' as CollectionVisibility,
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
  const isInCollection = itemInCollections.value.some((c: any) => c.id === collection.id);

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
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.add-to-list-popover')) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const popoverClasses = computed(() => {
  const baseClasses = 'add-to-list-popover absolute z-50 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4';
  const positionClasses = [];

  if (props.position.top) {
    positionClasses.push('bottom-full mb-2');
  } else {
    positionClasses.push('top-full mt-2');
  }

  if (props.position.right) {
    positionClasses.push('right-0');
  } else {
    positionClasses.push('left-0');
  }

  return `${baseClasses} ${positionClasses.join(' ')}`;
});
</script>

<template>
  <div v-if="isVisible" :class="popoverClasses">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
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
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Create New List -->
    <div class="mb-3">
      <div v-if="!isCreatingNew">
        <button
          class="w-full flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
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
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleCreateNewCollection"
          @keyup.escape="isCreatingNew = false"
        />
        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            :disabled="!newCollectionName.trim() || isLoading"
            @click="handleCreateNewCollection"
          >
            Create
          </button>
          <button
            class="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            @click="isCreatingNew = false; newCollectionName = ''"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-200 dark:border-gray-600 mb-3" />

    <!-- Lists -->
    <div class="max-h-64 overflow-y-auto space-y-1">
      <!-- Favorites List -->
      <div
        v-if="favoritesList"
        class="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer"
        @click="handleToggleInCollection(favoritesList)"
      >
        <div class="flex items-center">
          <span class="text-yellow-500 mr-2">★</span>
          <span class="text-gray-900 dark:text-white">{{ favoritesList.name }}</span>
        </div>
        <input
          type="checkbox"
          :checked="isItemInFavorites"
          class="rounded text-blue-600 focus:ring-blue-500"
          readonly
        />
      </div>

      <!-- Custom Collections -->
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        class="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer"
        @click="handleToggleInCollection(collection)"
      >
        <div class="flex items-center">
          <span class="text-gray-500 mr-2">📝</span>
          <span class="text-gray-900 dark:text-white">{{ collection.name }}</span>
          <span class="text-xs text-gray-500 ml-2">({{ collection.itemCount }})</span>
        </div>
        <input
          type="checkbox"
          :checked="itemInCollections.some((c: any) => c.id === collection.id)"
          class="rounded text-blue-600 focus:ring-blue-500"
          readonly
        />
      </div>

      <!-- No Results -->
      <div
        v-if="filteredCollections.length === 0 && searchTerm"
        class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center"
      >
        No lists found for "{{ searchTerm }}"
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredCollections.length === 0 && !searchTerm && !favoritesList"
        class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center"
      >
        No lists yet. Create your first list above!
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  </div>
</template>

<style scoped>
.add-to-list-popover {
  min-width: 320px;
}
</style>