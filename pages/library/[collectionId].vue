<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { useRoute, useRouter } from 'vue-router';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import {
  GET_COLLECTION_ITEMS,
  GET_ALL_USER_COLLECTIONS,
} from '@/graphQLData/collection/queries';
import {
  UPDATE_COLLECTION,
  DELETE_COLLECTION,
} from '@/graphQLData/collection/mutations';
import GenericModal from '@/components/GenericModal.vue';
import WarningModal from '@/components/WarningModal.vue';
import { useUsername } from '@/composables/useAuthState';
import type { Discussion, Comment } from '@/__generated__/graphql';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import {
  getCollectionTypeLabel,
  getCollectionItems,
  buildCollectionDiscussionLink,
  resolveCollectionItemAuthor,
} from '@/utils/collectionItemUtils';
import {
  getCommentPermalink,
  getCommentContextPermalink,
  getCommentContextTitle,
  getCommentContextType,
} from '@/utils/commentUtils';

const usernameVar = useUsername();

const route = useRoute();
const collectionId = computed(() => route.params.collectionId as string);
const { serverAdminUsernames } = useServerRoleMembership();

const {
  result,
  loading,
  error,
  refetch: refetchCollection,
} = useQuery(
  GET_COLLECTION_ITEMS,
  () => ({
    collectionId: collectionId.value,
    loggedInUsername: usernameVar.value,
  }),
  () => ({
    enabled: !!collectionId.value,
  })
);

const collection = computed(() => {
  return result.value?.collections?.[0] || null;
});

const collectionName = computed(() => collection.value?.name || 'Collection');

useHead({
  title: computed(() => `${collectionName.value} - Library`),
});

const getDiscussionLink = (discussion: Discussion) =>
  buildCollectionDiscussionLink({
    discussion,
    isDownloadsCollection: collection.value?.collectionType === 'DOWNLOADS',
  });

const getAuthorInfo = (item: Discussion | Comment) =>
  resolveCollectionItemAuthor({
    item,
    adminUsernames: serverAdminUsernames.value,
  });

const getPreviewImage = (item: {
  Album?: {
    imageOrder?: string[] | null;
    Images?: Array<{ id: string; url?: string | null }> | null;
  } | null;
}) => {
  const album = item.Album;
  if (!album?.Images?.length) return '';

  if (album.imageOrder?.length) {
    const firstImageId = album.imageOrder[0];
    const orderedImage = album.Images.find((image) => image.id === firstImageId);
    return orderedImage?.url || '';
  }

  return album.Images[0]?.url || '';
};

type CollectionDiscussionChannel = {
  CommentsAggregate?: {
    count?: number | null;
  } | null;
};

// Get items based on collection type
const items = computed(() => getCollectionItems(collection.value));

const collectionTypeLabel = computed(() =>
  getCollectionTypeLabel(collection.value?.collectionType)
);

// Rename modal state
const showRenameModal = ref(false);
const newCollectionName = ref('');
const newCollectionDescription = ref('');

// Delete modal state
const showDeleteModal = ref(false);

const router = useRouter();

// Mutations
const {
  mutate: updateCollection,
  loading: updateLoading,
  error: updateError,
} = useMutation(UPDATE_COLLECTION);
const {
  mutate: deleteCollection,
  loading: deleteLoading,
  error: deleteError,
} = useMutation(DELETE_COLLECTION);
const visibilityUpdating = ref(false);
const visibilityError = ref<string | null>(null);

// Open rename modal with current values
const openRenameModal = () => {
  newCollectionName.value = collection.value?.name || '';
  newCollectionDescription.value = collection.value?.description || '';
  showRenameModal.value = true;
};

// Handle rename
const handleRename = async () => {
  if (!newCollectionName.value.trim()) {
    return;
  }

  try {
    await updateCollection({
      collectionId: collectionId.value,
      name: newCollectionName.value.trim(),
      description: newCollectionDescription.value.trim(),
    });

    showRenameModal.value = false;
  } catch (err) {
    console.error('Error updating collection:', err);
  }
};

const handleToggleVisibility = async () => {
  if (!collection.value) return;

  const currentVisibility = collection.value.visibility;
  const nextVisibility = currentVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';

  visibilityUpdating.value = true;
  visibilityError.value = null;
  try {
    await updateCollection({
      collectionId: collectionId.value,
      visibility: nextVisibility,
    });
    await refetchCollection();
  } catch (err: unknown) {
    console.error('Error updating visibility:', err);
    visibilityError.value = err instanceof Error ? err.message : 'Failed to update visibility.';
  } finally {
    visibilityUpdating.value = false;
  }
};

// Handle delete
const handleDelete = async () => {
  try {
    await deleteCollection(
      {
        collectionId: collectionId.value,
      },
      {
        refetchQueries: [
          {
            query: GET_ALL_USER_COLLECTIONS,
            variables: {
              username: usernameVar.value,
            },
          },
        ],
        awaitRefetchQueries: true,
      }
    );

    showDeleteModal.value = false;
    router.push('/library');
  } catch (err) {
    console.error('Error deleting collection:', err);
  }
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="w-full px-4 sm:px-6 lg:px-8">
          <div class="py-6 md:py-8">
            <!-- Loading state -->
            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading collection...
              </p>
            </div>

            <!-- Error state -->
            <div
              v-else-if="error"
              class="bg-red-50 rounded-lg p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading collection: {{ error.message }}
              </p>
            </div>

            <!-- Collection not found -->
            <div v-else-if="!collection" class="py-12 text-center">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Collection not found
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This collection doesn't exist or you don't have access to it.
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/library"
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
                >
                  Back to Library
                </NuxtLink>
              </div>
            </div>

            <!-- Collection content -->
            <template v-else>
              <!-- Header -->
              <div class="mb-8">
                <!-- Back button for mobile -->
                <NuxtLink
                  to="/library"
                  class="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Library
                </NuxtLink>

                <!-- Title and actions -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h1
                      class="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl"
                    >
                      {{ collection.name }}
                    </h1>
                    <p
                      v-if="collection.description"
                      class="mt-2 text-gray-600 dark:text-gray-300"
                    >
                      {{ collection.description }}
                    </p>
                    <div
                      class="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <span class="capitalize">{{
                        collection.visibility.toLowerCase()
                      }}</span>
                      <span
                        >{{ collection.itemCount }}
                        {{ collectionTypeLabel.toLowerCase() }}</span
                      >
                    </div>
                    <p
                      v-if="visibilityError"
                      class="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {{ visibilityError }}
                    </p>
                  </div>

                  <!-- Action buttons -->
                  <div class="ml-4 flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      class="hover:bg-gray-50 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      :disabled="visibilityUpdating || updateLoading"
                      @click="handleToggleVisibility"
                    >
                      <svg
                        class="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      {{
                        collection.visibility === 'PUBLIC'
                          ? 'Make Private'
                          : 'Make Public'
                      }}
                    </button>
                    <button
                      type="button"
                      class="hover:bg-gray-50 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      @click="openRenameModal"
                    >
                      <svg
                        class="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Rename
                    </button>
                    <button
                      type="button"
                      class="hover:bg-red-50 inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm dark:border-red-600 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      @click="showDeleteModal = true"
                    >
                      <svg
                        class="mr-1.5 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="items.length === 0" class="py-12 text-center">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3
                  class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  No items yet
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start adding {{ collectionTypeLabel.toLowerCase() }} to this
                  collection.
                </p>
              </div>

              <div
                v-else-if="
                  collection.collectionType === 'DISCUSSIONS' ||
                  collection.collectionType === 'DOWNLOADS'
                "
                class="space-y-4"
              >
                <template
                  v-for="discussion in items"
                  :key="discussion.id"
                >
                  <LibraryDownloadCard
                    v-if="collection.collectionType === 'DOWNLOADS'"
                    :download="discussion"
                    :download-link="getDiscussionLink(discussion)"
                    :channel-link="
                      discussion.DiscussionChannels?.[0]?.channelUniqueName
                        ? `/forums/${discussion.DiscussionChannels[0].channelUniqueName}`
                        : '/'
                    "
                    :channel-unique-name="
                      discussion.DiscussionChannels?.[0]?.channelUniqueName || ''
                    "
                    :author-info="getAuthorInfo(discussion)"
                    :preview-image-url="getPreviewImage(discussion)"
                    :show-favorite-button="true"
                    :allow-add-to-list="true"
                    :is-favorited="Boolean(discussion.isFavorited)"
                  />
                  <LibraryDiscussionCard
                    v-else
                    :discussion="discussion"
                    :discussion-link="getDiscussionLink(discussion)"
                    :channel-link="
                      discussion.DiscussionChannels?.[0]?.channelUniqueName
                        ? `/forums/${discussion.DiscussionChannels[0].channelUniqueName}`
                        : '/'
                    "
                    :channel-unique-name="
                      discussion.DiscussionChannels?.[0]?.channelUniqueName || ''
                    "
                    :author-info="getAuthorInfo(discussion)"
                    :comment-count="
                      discussion.DiscussionChannels?.reduce(
                        (
                          total: number,
                          item: CollectionDiscussionChannel
                        ) => total + (item.CommentsAggregate?.count || 0),
                        0
                      ) || 0
                    "
                    :show-favorite-button="true"
                    :allow-add-to-list="true"
                    :is-favorited="Boolean(discussion.isFavorited)"
                  />
                </template>
              </div>

              <div
                v-else-if="collection.collectionType === 'CHANNELS'"
                class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                <LibraryChannelCard
                  v-for="channel in items"
                  :key="channel.uniqueName"
                  :channel="channel"
                  :show-favorite-button="true"
                  :allow-add-to-list="true"
                  :is-favorited="Boolean(channel.isFavorited)"
                />
              </div>

              <div
                v-else-if="collection.collectionType === 'COMMENTS'"
                class="space-y-4"
              >
                <LibraryCommentCard
                  v-for="comment in items"
                  :key="comment.id"
                  :comment="comment"
                  :author-info="getAuthorInfo(comment)"
                  :context-type="getCommentContextType(comment)"
                  :context-title="getCommentContextTitle(comment)"
                  :context-permalink="getCommentContextPermalink(comment)"
                  :permalink="getCommentPermalink(comment)"
                  :show-favorite-button="true"
                  :allow-add-to-list="true"
                  :is-favorited="Boolean(comment.isFavorited)"
                />
              </div>

              <div
                v-else-if="collection.collectionType === 'IMAGES'"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                <ImageListItem
                  v-for="image in items"
                  :key="image.id"
                  :image="image"
                  :username="image.Uploader?.username || ''"
                  :show-favorite-button="false"
                  :allow-add-to-list="true"
                />
              </div>
            </template>
          </div>
        </div>

        <!-- Rename Modal -->
        <GenericModal
          :open="showRenameModal"
          title="Rename Collection"
          primary-button-text="Save"
          secondary-button-text="Cancel"
          :loading="updateLoading"
          :error="updateError?.message || ''"
          :primary-button-disabled="!newCollectionName.trim()"
          @close="showRenameModal = false"
          @primary-button-click="handleRename"
        >
          <template #icon>
            <svg
              class="h-6 w-6 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </template>
          <template #content>
            <div class="space-y-4">
              <div>
                <label
                  for="collection-name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Collection Name
                </label>
                <input
                  id="collection-name"
                  v-model="newCollectionName"
                  type="text"
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter collection name"
                >
              </div>
              <div>
                <label
                  for="collection-description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description (optional)
                </label>
                <textarea
                  id="collection-description"
                  v-model="newCollectionDescription"
                  rows="3"
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter description"
                />
              </div>
            </div>
          </template>
        </GenericModal>

        <!-- Delete Modal -->
        <WarningModal
          :open="showDeleteModal"
          title="Delete Collection"
          body="Are you sure you want to delete this collection? This action cannot be undone."
          primary-button-text="Delete"
          secondary-button-text="Cancel"
          :loading="deleteLoading"
          :error="deleteError?.message || ''"
          icon="trash"
          @close="showDeleteModal = false"
          @primary-button-click="handleDelete"
        />
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-md py-12 text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In Required
          </h1>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Please sign in to view this collection.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
