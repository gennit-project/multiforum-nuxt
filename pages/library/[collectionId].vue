<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { useRoute, useRouter } from 'vue-router';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { GET_COLLECTION_ITEMS } from '@/graphQLData/collection/queries';
import { UPDATE_COLLECTION, DELETE_COLLECTION } from '@/graphQLData/collection/mutations';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import TagComponent from '@/components/TagComponent.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import GenericModal from '@/components/GenericModal.vue';
import WarningModal from '@/components/WarningModal.vue';
import { relativeTime } from '@/utils';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';

// Lazy load the album component since it's not needed for initial render
const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

const route = useRoute();
const collectionId = computed(() => route.params.collectionId as string);

const { result, loading, error } = useQuery(
  GET_COLLECTION_ITEMS,
  () => ({
    collectionId: collectionId.value,
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

const getDiscussionLink = (discussion: any) => {
  const firstChannel = safeArrayFirst(discussion.DiscussionChannels) as any;
  if (!firstChannel?.channelUniqueName) return '/';

  return `/forums/${firstChannel.channelUniqueName}/discussions/${discussion.id}`;
};

const getAuthorInfo = (item: any) => {
  // Comments use CommentAuthor, other types use Author
  const author = item?.CommentAuthor || item?.Author;
  if (!author) return null;

  return {
    username: author.username || '',
    displayName: author.displayName || '',
    profilePicURL: author.profilePicURL || '',
    commentKarma: author.commentKarma ?? 0,
    discussionKarma: author.discussionKarma ?? 0,
    createdAt: author.createdAt || '',
    isAdmin: author.ServerRoles?.[0]?.showAdminTag || false,
  };
};

// Get items based on collection type
const items = computed(() => {
  if (!collection.value) return [];

  switch (collection.value.collectionType) {
    case 'DISCUSSIONS':
      return collection.value.Discussions || [];
    case 'COMMENTS':
      return collection.value.Comments || [];
    case 'IMAGES':
      return collection.value.Images || [];
    case 'CHANNELS':
      return collection.value.Channels || [];
    case 'DOWNLOADS':
      return collection.value.Downloads || [];
    default:
      return [];
  }
});

const collectionTypeLabel = computed(() => {
  const type = collection.value?.collectionType;
  switch (type) {
    case 'DISCUSSIONS':
      return 'Discussions';
    case 'COMMENTS':
      return 'Comments';
    case 'IMAGES':
      return 'Images';
    case 'CHANNELS':
      return 'Forums';
    case 'DOWNLOADS':
      return 'Downloads';
    default:
      return 'Items';
  }
});

// Rename modal state
const showRenameModal = ref(false);
const newCollectionName = ref('');
const newCollectionDescription = ref('');

// Delete modal state
const showDeleteModal = ref(false);

const router = useRouter();

// Mutations
const { mutate: updateCollection, loading: updateLoading, error: updateError } = useMutation(UPDATE_COLLECTION);
const { mutate: deleteCollection, loading: deleteLoading, error: deleteError } = useMutation(DELETE_COLLECTION);

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

// Handle delete
const handleDelete = async () => {
  try {
    await deleteCollection({
      collectionId: collectionId.value,
    });

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
              class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading collection: {{ error.message }}
              </p>
            </div>

            <!-- Collection not found -->
            <div
              v-else-if="!collection"
              class="py-12 text-center"
            >
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
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                      {{ collection.name }}
                    </h1>
                    <p
                      v-if="collection.description"
                      class="mt-2 text-gray-600 dark:text-gray-300"
                    >
                      {{ collection.description }}
                    </p>
                    <div class="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span class="capitalize">{{ collection.visibility.toLowerCase() }}</span>
                      <span>{{ collection.itemCount }} {{ collectionTypeLabel.toLowerCase() }}</span>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="ml-4 flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      @click="openRenameModal"
                    >
                      <svg
                        class="h-4 w-4 mr-1.5"
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
                      class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 dark:border-red-600 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      @click="showDeleteModal = true"
                    >
                      <svg
                        class="h-4 w-4 mr-1.5"
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
              <div
                v-if="items.length === 0"
                class="py-12 text-center"
              >
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
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No items yet
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start adding {{ collectionTypeLabel.toLowerCase() }} to this collection.
                </p>
              </div>

              <!-- Discussions list -->
              <div
                v-else-if="collection.collectionType === 'DISCUSSIONS' || collection.collectionType === 'DOWNLOADS'"
                class="space-y-4"
              >
                <div
                  v-for="discussion in items"
                  :key="discussion.id"
                  class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <!-- Discussion header -->
                  <div class="mb-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <span
                          v-if="discussion.hasSensitiveContent"
                          class="rounded-full border border-orange-600 px-2 py-1 text-xs text-orange-600 dark:border-orange-400 dark:text-orange-400"
                        >
                          Sensitive
                        </span>
                      </div>
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ relativeTime(discussion.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- Discussion title -->
                  <div class="mb-3 flex items-center justify-between">
                    <NuxtLink
                      :to="getDiscussionLink(discussion)"
                      class="min-w-0 flex-1 text-lg font-semibold text-gray-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                    >
                      {{ discussion.title }}
                    </NuxtLink>
                    <div class="ml-4 flex-shrink-0">
                      <AddToDiscussionFavorites
                        :allow-add-to-list="true"
                        :discussion-id="discussion.id"
                        :discussion-title="discussion.title"
                        size="medium"
                      />
                    </div>
                  </div>

                  <!-- Album -->
                  <div
                    v-if="discussion.Album && discussion.Album?.Images.length > 0"
                    class="mb-4 max-w-full overflow-x-auto bg-black"
                  >
                    <DiscussionAlbum
                      :album="discussion.Album"
                      :discussion-id="discussion.id"
                      :discussion-author="
                        getAuthorInfo(discussion)?.username || 'Deleted'
                      "
                      :carousel-format="true"
                      :show-edit-album="false"
                    />
                  </div>

                  <!-- Meta information -->
                  <div class="flex items-center justify-between">
                    <div
                      class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <!-- Author -->
                      <div class="flex items-center">
                        <span class="mr-1">by</span>
                        <UsernameWithTooltip
                          v-if="getAuthorInfo(discussion)"
                          :username="getAuthorInfo(discussion)!.username"
                          :display-name="getAuthorInfo(discussion)!.displayName"
                          :src="getAuthorInfo(discussion)!.profilePicURL"
                          :is-admin="getAuthorInfo(discussion)!.isAdmin"
                          :comment-karma="getAuthorInfo(discussion)!.commentKarma"
                          :discussion-karma="
                            getAuthorInfo(discussion)!.discussionKarma
                          "
                          :account-created="getAuthorInfo(discussion)!.createdAt"
                        />
                        <span v-else>Deleted</span>
                      </div>
                    </div>
                  </div>

                  <!-- Tags -->
                  <div
                    v-if="discussion.Tags && discussion.Tags.length > 0"
                    class="mt-4 flex flex-wrap gap-2"
                  >
                    <TagComponent
                      v-for="tag in discussion.Tags.slice(0, 5)"
                      :key="tag.text"
                      :tag="tag.text"
                      class="text-xs"
                      @click.prevent=""
                    />
                  </div>
                </div>
              </div>

              <!-- Channels list -->
              <div
                v-else-if="collection.collectionType === 'CHANNELS'"
                class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                <NuxtLink
                  v-for="channel in items"
                  :key="channel.uniqueName"
                  :to="`/forums/${channel.uniqueName}`"
                  class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div class="flex items-center">
                    <AvatarComponent
                      :text="channel.uniqueName"
                      :is-square="true"
                      class="mr-3 h-12 w-12"
                    />
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate font-semibold text-gray-900 dark:text-white">
                        {{ channel.displayName }}
                      </h3>
                      <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                        /{{ channel.uniqueName }}
                      </p>
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <!-- Comments list -->
              <div
                v-else-if="collection.collectionType === 'COMMENTS'"
                class="space-y-4"
              >
                <div
                  v-for="comment in items"
                  :key="comment.id"
                  class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div class="text-sm text-gray-600 dark:text-gray-300">
                    <MarkdownRenderer :text="comment.text" font-size="small" />
                  </div>
                  <div class="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div class="flex items-center">
                      <span class="mr-1">by</span>
                      <UsernameWithTooltip
                        v-if="getAuthorInfo(comment)"
                        :username="getAuthorInfo(comment)!.username"
                        :display-name="getAuthorInfo(comment)!.displayName"
                        :src="getAuthorInfo(comment)!.profilePicURL"
                        :is-admin="getAuthorInfo(comment)!.isAdmin"
                        :comment-karma="getAuthorInfo(comment)!.commentKarma"
                        :discussion-karma="getAuthorInfo(comment)!.discussionKarma"
                        :account-created="getAuthorInfo(comment)!.createdAt"
                      />
                      <span v-else>Deleted</span>
                    </div>
                    <span>{{ relativeTime(comment.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Images list -->
              <div
                v-else-if="collection.collectionType === 'IMAGES'"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              >
                <div
                  v-for="image in items"
                  :key="image.id"
                  class="group relative"
                >
                  <NuxtLink
                    :to="`/u/${image.Uploader?.username}/images/${image.id}`"
                    class="block"
                  >
                    <img
                      :src="image.url"
                      :alt="image.alt || image.caption || 'Image'"
                      class="h-48 w-full rounded-lg object-cover shadow-sm transition-transform hover:scale-105"
                    >
                  </NuxtLink>
                  <p
                    v-if="image.caption"
                    class="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    {{ image.caption }}
                  </p>
                </div>
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
          :error="(updateError as any)?.message || ''"
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
                />
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
          :error="(deleteError as any)?.message || ''"
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

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
