<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { useHead } from 'nuxt/app';
import { useRoute, useRouter } from 'vue-router';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import Breadcrumbs from '@/components/nav/Breadcrumbs.vue';
import LibraryListSkeleton from '@/components/library/LibraryListSkeleton.vue';
import LibraryReorderControls from '@/components/library/LibraryReorderControls.vue';
import LibraryItemIcon from '@/components/library/LibraryItemIcon.vue';
import Tooltip from '@/components/Tooltip.vue';
import ArrowUpRightIcon from '@/components/icons/ArrowUpRightIcon.vue';
import EllipsisHorizontal from '@/components/icons/EllipsisHorizontal.vue';
import LockClosedIcon from '@/components/icons/LockClosedIcon.vue';
import LockOpenIcon from '@/components/icons/LockOpenIcon.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import TrashIcon from '@/components/icons/TrashIcon.vue';
import {
  GET_COLLECTION_ITEMS,
  GET_ALL_USER_COLLECTIONS,
} from '@/graphQLData/collection/queries';
import {
  UPDATE_COLLECTION,
  DELETE_COLLECTION,
  REORDER_COLLECTION_ITEM,
  SHARE_COLLECTION_AS_DISCUSSION,
} from '@/graphQLData/collection/mutations';
import { useUsername } from '@/composables/useAuthState';
import type { Discussion, Comment } from '@/__generated__/graphql';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import {
  getCollectionTypeLabel,
  getCollectionItems,
  getCollectionItemStableId,
  buildCollectionDiscussionLink,
  resolveCollectionItemAuthor,
} from '@/utils/collectionItemUtils';
import {
  getCommentPermalink,
  getCommentContextPermalink,
  getCommentContextTitle,
  getCommentContextType,
} from '@/utils/commentUtils';
import { isAutoSavedDownloadsCollection } from '@/utils/downloadLibraryCollection';

const GenericModal = defineAsyncComponent(
  () => import('@/components/GenericModal.vue')
);
const WarningModal = defineAsyncComponent(
  () => import('@/components/WarningModal.vue')
);
const ForumPicker = defineAsyncComponent(
  () => import('@/components/channel/ForumPicker.vue')
);

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
const isAutoSavedDownloads = computed(() =>
  isAutoSavedDownloadsCollection(collection.value)
);

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
    const orderedImage = album.Images.find(
      (image) => image.id === firstImageId
    );
    return orderedImage?.url || '';
  }

  return album.Images[0]?.url || '';
};

type CollectionDiscussionChannel = {
  CommentsConnection?: {
    aggregate?: { count?: { nodes?: number | null } | null } | null;
  } | null;
};

// Get items based on collection type
const items = computed(() => getCollectionItems(collection.value));

const collectionTypeLabel = computed(() =>
  getCollectionTypeLabel(collection.value?.collectionType)
);

const breadcrumbLinks = computed(() => [
  { label: 'Home', path: '/' },
  { label: 'Library', path: 'library' },
  { label: 'Custom Collections', path: 'library' },
  { label: collectionName.value, current: true },
]);

// Rename modal state
const showRenameModal = ref(false);
const newCollectionName = ref('');
const newCollectionDescription = ref('');

// Delete modal state
const showDeleteModal = ref(false);
const showShareModal = ref(false);
const isReorderMode = ref(false);
const selectedShareForums = ref<string[]>([]);
const shareTitle = ref('');
const shareMessage = ref('');

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
const {
  mutate: reorderCollectionItem,
  loading: reorderLoading,
  error: reorderError,
} = useMutation(REORDER_COLLECTION_ITEM);
const {
  mutate: shareCollectionAsDiscussion,
  loading: shareLoading,
  error: shareError,
} = useMutation(SHARE_COLLECTION_AS_DISCUSSION);
const visibilityUpdating = ref(false);
const visibilityError = ref<string | null>(null);
const shareSubmitError = ref<string | null>(null);

const collectionIsPublic = computed(
  () => collection.value?.visibility === 'PUBLIC'
);
const collectionItemCountLabel = computed(() => {
  const count = collection.value?.itemCount ?? items.value.length;
  return `${count} ${count === 1 ? 'item' : 'items'}`;
});
const shareTooltipText = computed(() =>
  collectionIsPublic.value
    ? 'Share this public collection to a forum discussion.'
    : "This collection can't be shared because it is private."
);

const getItemId = (item: unknown) => getCollectionItemStableId(item);

const getReorderLabel = (item: {
  title?: string | null;
  displayName?: string | null;
  uniqueName?: string | null;
  alt?: string | null;
}) =>
  item.title ||
  item.displayName ||
  item.uniqueName ||
  item.alt ||
  (collection.value?.collectionType === 'COMMENTS' ? 'comment' : 'item');

const moveCollectionItem = async (item: unknown, newPosition: number) => {
  const itemId = getItemId(item);
  if (!itemId || newPosition < 0 || newPosition >= items.value.length) return;

  await reorderCollectionItem({
    collectionId: collectionId.value,
    itemId,
    newPosition,
  });
  await refetchCollection();
};

// Open rename modal with current values
const openRenameModal = () => {
  newCollectionName.value = collection.value?.name || '';
  newCollectionDescription.value = collection.value?.description || '';
  showRenameModal.value = true;
};

const openShareModal = () => {
  if (!collectionIsPublic.value) return;
  shareTitle.value = collection.value?.name
    ? `Shared collection: ${collection.value.name}`
    : 'Shared collection';
  shareMessage.value = '';
  selectedShareForums.value = [];
  shareSubmitError.value = null;
  showShareModal.value = true;
};

const handleShareCollection = async () => {
  const targetForum = selectedShareForums.value[0];
  if (!targetForum || !shareTitle.value.trim()) return;

  shareSubmitError.value = null;
  try {
    const result = await shareCollectionAsDiscussion({
      collectionId: collectionId.value,
      serverId: targetForum,
      title: shareTitle.value.trim(),
      shareMessage: shareMessage.value.trim() || null,
    });
    const shareResult = result as {
      data?: {
        shareCollectionAsDiscussion?: {
          id?: string;
          DiscussionChannels?: Array<{ channelUniqueName?: string | null }>;
        };
      };
    } | null;
    const sharedDiscussion = shareResult?.data?.shareCollectionAsDiscussion;
    const discussionId = sharedDiscussion?.id;
    const forumId =
      sharedDiscussion?.DiscussionChannels?.[0]?.channelUniqueName ||
      targetForum;

    showShareModal.value = false;
    if (discussionId) {
      router.push(`/forums/${forumId}/discussions/${discussionId}`);
    }
  } catch (err: unknown) {
    console.error('Error sharing collection:', err);
    shareSubmitError.value =
      err instanceof Error ? err.message : 'Failed to share collection.';
  }
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
    visibilityError.value =
      err instanceof Error ? err.message : 'Failed to update visibility.';
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
  <div class="min-h-screen bg-transparent dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="w-full px-4 sm:px-6 lg:px-8">
          <div class="py-6 md:py-8">
            <Breadcrumbs :links="breadcrumbLinks" />

            <!-- Loading state -->
            <LibraryListSkeleton
              v-if="loading"
              class="py-8"
              label="Loading collection"
              variant="rows"
              :count="4"
            />

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
                  class="bg-brand-500 hover:bg-brand-600 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
                >
                  Back to Library
                </NuxtLink>
              </div>
            </div>

            <!-- Collection content -->
            <template v-else>
              <!-- Header -->
              <div
                class="border-t-brand-500/60 dark:border-t-brand-500/60 mb-8 rounded-[1.75rem] border border-gray-200/80 bg-white/90 p-5 shadow-[0_24px_70px_-42px_rgba(38,38,38,0.26)] backdrop-blur lg:p-6 dark:border-gray-700 dark:bg-gray-900 dark:shadow-[0_24px_70px_-48px_rgba(0,0,0,0.82)]"
              >
                <!-- Back button for mobile -->
                <NuxtLink
                  to="/library"
                  class="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 md:hidden dark:text-gray-400 dark:hover:text-gray-200"
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

                <div
                  class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div class="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      class="border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/60 dark:text-brand-300 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border"
                      aria-hidden="true"
                    >
                      <LibraryItemIcon
                        class="h-9 w-9"
                        :collection-type="collection.collectionType"
                      />
                    </div>

                    <div class="min-w-0 flex-1">
                      <p
                        class="text-brand-700 dark:text-brand-300 text-[11px] font-bold tracking-[0.16em] uppercase"
                      >
                        Custom collection
                      </p>
                      <div class="mt-1 flex flex-wrap items-center gap-3">
                        <h1
                          class="min-w-0 text-3xl font-semibold tracking-[-0.04em] text-gray-950 md:text-4xl dark:text-white"
                        >
                          {{ collection.name }}
                        </h1>
                        <span
                          class="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {{ collectionItemCountLabel }}
                        </span>
                      </div>
                      <p
                        v-if="collection.description"
                        class="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300"
                      >
                        {{ collection.description }}
                      </p>

                      <div
                        class="mt-3 flex flex-wrap items-center gap-2 text-sm"
                      >
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 font-medium text-green-700 dark:border-green-500/35 dark:bg-green-500/12 dark:text-green-300"
                        >
                          <LibraryItemIcon
                            class="h-4 w-4"
                            :collection-type="collection.collectionType"
                          />
                          {{ collectionTypeLabel }}
                        </span>
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 font-medium text-gray-700 capitalize dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <LockOpenIcon
                            v-if="collectionIsPublic"
                            class="h-4 w-4"
                          />
                          <LockClosedIcon v-else class="h-4 w-4" />
                          {{ collection.visibility.toLowerCase() }}
                        </span>
                      </div>

                      <span
                        v-if="visibilityError"
                        class="mt-2 block text-sm text-red-600 dark:text-red-400"
                      >
                        {{ visibilityError }}
                      </span>
                      <span
                        v-if="reorderError"
                        class="mt-2 block text-sm text-red-600 dark:text-red-400"
                      >
                        Could not update collection order:
                        {{ reorderError.message }}
                      </span>
                    </div>
                  </div>

                  <div
                    class="flex w-full flex-wrap items-center gap-2 lg:ml-4 lg:w-auto lg:shrink-0 lg:flex-nowrap lg:justify-end"
                  >
                    <Tooltip location="top" :aria-label="shareTooltipText">
                      <template #activator="{ props: tooltipProps }">
                        <button
                          v-bind="tooltipProps"
                          type="button"
                          data-testid="share-collection-button"
                          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 shadow-sm transition hover:bg-green-100 focus:ring-2 focus:ring-green-500/30 focus:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-55 dark:border-green-500/35 dark:bg-green-500/12 dark:text-green-200 dark:hover:bg-green-500/20"
                          :aria-disabled="!collectionIsPublic"
                          @click="openShareModal"
                        >
                          <ArrowUpRightIcon
                            class="h-4 w-4"
                            aria-hidden="true"
                          />
                          Share to forum
                        </button>
                      </template>
                      {{ shareTooltipText }}
                    </Tooltip>
                    <button
                      type="button"
                      class="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-200 focus:ring-2 focus:ring-gray-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                      :disabled="visibilityUpdating || updateLoading"
                      @click="handleToggleVisibility"
                    >
                      <LockClosedIcon
                        v-if="collectionIsPublic"
                        class="h-4 w-4"
                      />
                      <LockOpenIcon v-else class="h-4 w-4" />
                      {{
                        collection.visibility === 'PUBLIC'
                          ? 'Make Private'
                          : 'Make Public'
                      }}
                    </button>
                    <Menu as="div" class="relative">
                      <MenuButton
                        class="focus:ring-brand-500/30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        aria-label="Collection actions"
                      >
                        <EllipsisHorizontal
                          class="h-5 w-5"
                          aria-hidden="true"
                        />
                      </MenuButton>
                      <transition
                        enter-active-class="transition duration-100 ease-out"
                        enter-from-class="scale-95 opacity-0"
                        enter-to-class="scale-100 opacity-100"
                        leave-active-class="transition duration-75 ease-in"
                        leave-from-class="scale-100 opacity-100"
                        leave-to-class="scale-95 opacity-0"
                      >
                        <MenuItems
                          class="absolute right-0 z-30 mt-2 w-52 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                        >
                          <MenuItem v-slot="{ active, close }">
                            <button
                              type="button"
                              title="Edit collection"
                              class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-800 dark:text-gray-100"
                              :class="
                                active ? 'bg-gray-100 dark:bg-gray-800' : ''
                              "
                              @click="
                                openRenameModal();
                                close();
                              "
                            >
                              <PencilIcon class="h-4 w-4" />
                              Edit collection
                            </button>
                          </MenuItem>
                          <MenuItem v-slot="{ active, close }">
                            <button
                              type="button"
                              title="Delete collection"
                              class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400"
                              :class="
                                active ? 'bg-red-50 dark:bg-red-950/30' : ''
                              "
                              @click="
                                showDeleteModal = true;
                                close();
                              "
                            >
                              <TrashIcon class="h-4 w-4" />
                              Delete collection
                            </button>
                          </MenuItem>
                        </MenuItems>
                      </transition>
                    </Menu>
                  </div>
                </div>

                <div
                  v-if="isAutoSavedDownloads"
                  class="border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200 mt-4 rounded-xl border px-4 py-3 text-sm"
                >
                  Downloads are added to this private collection automatically
                  when you grab a file.
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

              <template v-else>
                <div
                  v-if="items.length > 1"
                  class="mb-4 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/60"
                >
                  <p
                    class="text-sm text-gray-600 dark:text-gray-300"
                    aria-live="polite"
                  >
                    {{
                      isReorderMode
                        ? 'Use the controls beside each item to change its position.'
                        : `${items.length} items in this collection.`
                    }}
                  </p>
                  <button
                    type="button"
                    class="focus-visible:ring-brand-500 inline-flex min-h-11 shrink-0 items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                    :aria-pressed="isReorderMode"
                    @click="isReorderMode = !isReorderMode"
                  >
                    {{ isReorderMode ? 'Done reordering' : 'Reorder' }}
                  </button>
                </div>

                <div
                  v-if="
                    collection.collectionType === 'DISCUSSIONS' ||
                    collection.collectionType === 'DOWNLOADS'
                  "
                  :class="
                    collection.collectionType === 'DOWNLOADS'
                      ? 'grid max-w-6xl gap-4 xl:grid-cols-2'
                      : 'max-w-5xl space-y-4'
                  "
                >
                  <template
                    v-for="(discussion, index) in items"
                    :key="getItemId(discussion)"
                  >
                    <div
                      class="grid items-start gap-3"
                      :class="
                        isReorderMode
                          ? 'grid-cols-[3.25rem_minmax(0,1fr)]'
                          : 'grid-cols-1'
                      "
                    >
                      <LibraryReorderControls
                        v-if="isReorderMode"
                        :item-label="getReorderLabel(discussion)"
                        :index="index"
                        :total="items.length"
                        :loading="reorderLoading"
                        @move="moveCollectionItem(discussion, $event)"
                      />
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
                          discussion.DiscussionChannels?.[0]
                            ?.channelUniqueName || ''
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
                          discussion.DiscussionChannels?.[0]
                            ?.channelUniqueName || ''
                        "
                        :author-info="getAuthorInfo(discussion)"
                        :comment-count="
                          discussion.DiscussionChannels?.reduce(
                            (
                              total: number,
                              item: CollectionDiscussionChannel
                            ) => total + (item.CommentsConnection?.aggregate?.count?.nodes || 0),
                            0
                          ) || 0
                        "
                        :show-favorite-button="true"
                        :allow-add-to-list="true"
                        :is-favorited="Boolean(discussion.isFavorited)"
                      />
                    </div>
                  </template>
                </div>

                <div
                  v-else-if="collection.collectionType === 'CHANNELS'"
                  class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  <div
                    v-for="(channel, index) in items"
                    :key="getItemId(channel)"
                    class="grid items-start gap-3"
                    :class="
                      isReorderMode
                        ? 'grid-cols-[3.25rem_minmax(0,1fr)]'
                        : 'grid-cols-1'
                    "
                  >
                    <LibraryReorderControls
                      v-if="isReorderMode"
                      :item-label="getReorderLabel(channel)"
                      :index="index"
                      :total="items.length"
                      :loading="reorderLoading"
                      @move="moveCollectionItem(channel, $event)"
                    />
                    <LibraryChannelCard
                      :channel="channel"
                      :show-favorite-button="true"
                      :allow-add-to-list="true"
                      :is-favorited="Boolean(channel.isFavorited)"
                    />
                  </div>
                </div>

                <div
                  v-else-if="collection.collectionType === 'COMMENTS'"
                  class="space-y-4"
                >
                  <div
                    v-for="(comment, index) in items"
                    :key="getItemId(comment)"
                    class="grid items-start gap-3"
                    :class="
                      isReorderMode
                        ? 'grid-cols-[3.25rem_minmax(0,1fr)]'
                        : 'grid-cols-1'
                    "
                  >
                    <LibraryReorderControls
                      v-if="isReorderMode"
                      :item-label="getReorderLabel(comment)"
                      :index="index"
                      :total="items.length"
                      :loading="reorderLoading"
                      @move="moveCollectionItem(comment, $event)"
                    />
                    <LibraryCommentCard
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
                </div>

                <div
                  v-else-if="collection.collectionType === 'IMAGES'"
                  class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  <div
                    v-for="(image, index) in items"
                    :key="getItemId(image)"
                    class="grid items-start gap-3"
                    :class="
                      isReorderMode
                        ? 'grid-cols-[3.25rem_minmax(0,1fr)]'
                        : 'grid-cols-1'
                    "
                  >
                    <LibraryReorderControls
                      v-if="isReorderMode"
                      :item-label="getReorderLabel(image)"
                      :index="index"
                      :total="items.length"
                      :loading="reorderLoading"
                      @move="moveCollectionItem(image, $event)"
                    />
                    <ImageListItem
                      :image="image"
                      :username="image.Uploader?.username || usernameVar"
                      :show-favorite-button="false"
                      :allow-add-to-list="true"
                    />
                  </div>
                </div>
              </template>
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
              class="text-brand-600 dark:text-brand-400 h-6 w-6"
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
                  class="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                  class="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter description"
                />
              </div>
            </div>
          </template>
        </GenericModal>

        <!-- Share Modal -->
        <GenericModal
          :open="showShareModal"
          title="Share Collection to Forum"
          primary-button-text="Share"
          secondary-button-text="Cancel"
          :loading="shareLoading"
          :error="shareSubmitError || shareError?.message || ''"
          :primary-button-disabled="
            !selectedShareForums.length || !shareTitle.trim()
          "
          @close="showShareModal = false"
          @primary-button-click="handleShareCollection"
        >
          <template #icon>
            <svg
              class="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4m0 0L8 6m4-4v14"
              />
            </svg>
          </template>
          <template #content>
            <div class="space-y-4">
              <p class="text-sm text-gray-600 dark:text-gray-300">
                This creates a forum discussion with your public collection
                embedded in the post.
              </p>
              <ForumPicker
                :selected-channels="selectedShareForums"
                description="Choose one forum for this shared collection."
                test-id="share-collection-forum-picker"
                @set-selected-channels="
                  selectedShareForums = $event.slice(0, 1)
                "
              />
              <div>
                <label
                  for="share-collection-title"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Discussion title
                </label>
                <input
                  id="share-collection-title"
                  v-model="shareTitle"
                  type="text"
                  class="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter discussion title"
                />
              </div>
              <div>
                <label
                  for="share-collection-message"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Message (optional)
                </label>
                <textarea
                  id="share-collection-message"
                  v-model="shareMessage"
                  rows="3"
                  class="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Add context for readers"
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
