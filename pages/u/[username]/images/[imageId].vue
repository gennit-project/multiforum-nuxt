<script lang="ts" setup>
import { config } from '@/config';
import { computed, watchEffect, ref, onMounted, onUnmounted } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useRoute, useHead } from 'nuxt/app';
import {
  GET_IMAGE_ALBUM_USAGE,
  GET_IMAGE_DETAILS,
  GET_USER_ALBUMS,
} from '@/graphQLData/image/queries';
import { ADD_IMAGE_TO_ALBUM } from '@/graphQLData/image/mutations';
import { UPDATE_IMAGE } from '@/graphQLData/discussion/mutations';
import type { Image } from '@/__generated__/graphql';
import { useCopyCurrentUrl } from '@/composables/useCopyCurrentUrl';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import LinkIcon from '@/components/icons/LinkIcon.vue';
import Notification from '@/components/NotificationComponent.vue';
import AddImageToFavorites from '@/components/favorites/AddImageToFavorites.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';
import { orderImagesByOrder } from '@/utils/albumImageOrder';
import { useUsername } from '@/composables/useAuthState';
import TextEditor from '@/components/TextEditor.vue';
import SaveButton from '@/components/SaveButton.vue';
import CancelButton from '@/components/CancelButton.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import AlbumThumbnailGrid from '@/components/album/AlbumThumbnailGrid.vue';
import { useImageZoomPan } from '@/composables/useImageZoomPan';
import AddToListPopover from '@/components/collection/AddToListPopover.vue';
import { useToastStore } from '@/stores/toastStore';

const usernameVar = useUsername();
const toastStore = useToastStore();

type AlbumUsageDiscussion = {
  id: string;
  title?: string | null;
  createdAt?: string | null;
  Author?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
  DiscussionChannels?: Array<{
    id?: string | null;
    channelUniqueName?: string | null;
  }> | null;
};

type AlbumUsageAlbum = {
  id: string;
  imageOrder?: string[] | null;
  Owner?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
  Images?: Array<{
    id: string;
    url?: string | null;
    alt?: string | null;
    caption?: string | null;
    Uploader?: {
      username?: string | null;
    } | null;
  }> | null;
  Discussions?: AlbumUsageDiscussion[] | null;
};

type ImageWithAlbums = Image & {
  Albums?: AlbumUsageAlbum[] | null;
};

type ImageAlbumUsageResult = {
  getImageAlbumUsage?: {
    imageId: string;
    uploaderUsername?: string | null;
    uploaderOwnedAlbums?: AlbumUsageAlbum[] | null;
    otherAlbums?: AlbumUsageAlbum[] | null;
  } | null;
};

type UserAlbumListItem = {
  id: string;
  imageOrder?: string[] | null;
  Owner?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
  ImagesAggregate?: {
    count?: number | null;
  } | null;
  Discussions?: Array<{
    title?: string | null;
  }> | null;
};

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  ssr: false,
});

const route = useRoute();

// Share functionality
const {
  showCopiedNotification: showCopiedLinkNotification,
  copyCurrentUrl: copyImageLink,
} = useCopyCurrentUrl();

const username = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const imageId = computed(() => {
  return typeof route.params.imageId === 'string' ? route.params.imageId : '';
});

const {
  result: imageResult,
  loading: imageLoading,
  error: imageError,
} = useQuery(
  GET_IMAGE_DETAILS,
  () => ({
    imageId: imageId.value,
  }),
  () => ({
    enabled: !!imageId.value,
    fetchPolicy: 'network-only',
  })
);

const { result: albumUsageResult, refetch: refetchAlbumUsage } =
  useQuery<ImageAlbumUsageResult>(
  GET_IMAGE_ALBUM_USAGE,
  () => ({
    imageId: imageId.value,
  }),
  () => ({
    enabled: !!imageId.value,
    fetchPolicy: 'network-only',
  })
);

const showAlbumSaveModal = ref(false);
const showCollectionSaveModal = ref(false);
const albumSaveError = ref('');

const { mutate: addImageToAlbum, loading: addImageToAlbumLoading } =
  useMutation(ADD_IMAGE_TO_ALBUM);

const { result: userAlbumsResult, loading: userAlbumsLoading, refetch: refetchUserAlbums } =
  useQuery(
    GET_USER_ALBUMS,
    () => ({
      where: {
        Owner: {
          username: usernameVar.value,
        },
      },
    }),
    () => ({
      enabled: showAlbumSaveModal.value && !!usernameVar.value,
      fetchPolicy: 'network-only',
    })
  );

const image = computed((): ImageWithAlbums | null => {
  if (imageError.value) return null;
  if (imageResult.value && imageResult.value.images.length > 0) {
    return imageResult.value.images[0] as ImageWithAlbums;
  }
  return null;
});

const uploader = computed(() => {
  return image.value?.Uploader;
});

// Check if the current user matches the username in the route
const isCorrectUserPage = computed(() => {
  return uploader.value?.username === username.value;
});

// Check if logged-in user is the uploader
const isLoggedInUploader = computed(() => {
  return usernameVar.value === uploader.value?.username;
});

// Caption and alt text editing
type EditingField = 'caption' | 'alt' | null;
const editingField = ref<EditingField>(null);
const editingCaption = ref('');
const editingAlt = ref('');

// Mutation to update image
const {
  mutate: updateImage,
  loading: updateLoading,
  onDone: onUpdateDone,
} = useMutation(UPDATE_IMAGE);

onUpdateDone(() => {
  cancelEditing();
});

const startEditingCaption = () => {
  editingField.value = 'caption';
  editingCaption.value = image.value?.caption || '';
};

const startEditingAlt = () => {
  editingField.value = 'alt';
  editingAlt.value = image.value?.alt || '';
};

const cancelEditing = () => {
  editingField.value = null;
  editingCaption.value = '';
  editingAlt.value = '';
};

const saveCaption = async () => {
  if (!image.value) return;

  try {
    await updateImage({
      imageId: image.value.id,
      caption: editingCaption.value,
    });
  } catch (error) {
    console.error('Error updating caption:', error);
    alert('Error saving caption. Please try again.');
  }
};

const saveAlt = async () => {
  if (!image.value) return;

  try {
    await updateImage({
      imageId: image.value.id,
      alt: editingAlt.value,
    });
  } catch (error) {
    console.error('Error updating alt text:', error);
    alert('Error saving alt text. Please try again.');
  }
};

const albumUsage = computed(() => {
  return albumUsageResult.value?.getImageAlbumUsage || null;
});

const uploaderOwnedAlbums = computed(() => {
  return albumUsage.value?.uploaderOwnedAlbums || [];
});

const otherAlbums = computed(() => {
  return albumUsage.value?.otherAlbums || [];
});

const currentUserAlbumIdsContainingImage = computed(() => {
  if (!usernameVar.value) return new Set<string>();

  const allUsageAlbums = [
    ...uploaderOwnedAlbums.value,
    ...otherAlbums.value,
  ];

  return new Set(
    allUsageAlbums
      .filter((album) => album.Owner?.username === usernameVar.value)
      .map((album) => album.id)
  );
});

const userAlbums = computed<UserAlbumListItem[]>(() => {
  return (userAlbumsResult.value?.albums || []) as UserAlbumListItem[];
});

const openAlbumSaveModal = () => {
  albumSaveError.value = '';
  showAlbumSaveModal.value = true;
  refetchUserAlbums();
};

const closeAlbumSaveModal = () => {
  showAlbumSaveModal.value = false;
  albumSaveError.value = '';
};

const openCollectionSaveModal = () => {
  showCollectionSaveModal.value = true;
};

const closeCollectionSaveModal = () => {
  showCollectionSaveModal.value = false;
};

const getAlbumDisplayName = (album: UserAlbumListItem) => {
  return album.Discussions?.[0]?.title || `Album ${album.id.slice(0, 8)}`;
};

const saveImageToAlbum = async (album: UserAlbumListItem) => {
  if (!image.value?.id || !album.id) return;

  if (currentUserAlbumIdsContainingImage.value.has(album.id)) {
    albumSaveError.value = 'This image is already in that album.';
    return;
  }

  albumSaveError.value = '';

  try {
    await addImageToAlbum({
      albumId: album.id,
      imageId: image.value.id,
    });
    toastStore.showToast('Image saved to album.');
    await refetchAlbumUsage();
    await refetchUserAlbums();
    closeAlbumSaveModal();
  } catch (error) {
    console.error('Error saving image to album:', error);
    albumSaveError.value =
      error instanceof Error ? error.message : 'Could not save image to album.';
    toastStore.showToast('Could not save image to album.', 'error');
  }
};

const albumUsageSections = computed(() => {
  return [
    {
      title: 'Albums by the uploader',
      albums: uploaderOwnedAlbums.value,
    },
    {
      title: 'Albums by other users',
      albums: otherAlbums.value,
    },
  ].filter((section) => section.albums.length > 0);
});

const hasAlbumUsage = computed(() => albumUsageSections.value.length > 0);

const primaryAlbum = computed(() => {
  const albums = image.value?.Albums || [];
  return (
    albums.find((album) => album.Owner?.username === uploader.value?.username) ||
    albums[0] ||
    null
  );
});

// Album images - ordered according to imageOrder (utils/albumImageOrder),
// excluding the current image.
const albumImages = computed(() => {
  const album = primaryAlbum.value;
  if (!album?.Images) return [];

  return orderImagesByOrder({
    images: album.Images,
    imageOrder: album.imageOrder,
  }).filter((img) => img.id !== image.value?.id);
});

// Lightbox zoom + pan state (extracted to a composable). The open guard keeps
// the component's url/format checks.
const {
  isLightboxOpen,
  zoomLevel,
  isZoomed,
  isDragging,
  translateX,
  translateY,
  startDrag,
  onDrag,
  stopDrag,
  openLightbox,
  closeLightbox,
  zoomIn,
  zoomOut,
  resetZoom,
  handleKeyDown,
} = useImageZoomPan({
  canOpenLightbox: () =>
    image.value?.url
      ? !hasGlbExtension(image.value.url) && !hasStlExtension(image.value.url)
      : false,
});

const downloadImage = (imageUrl: string) => {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      const filename = imageUrl.split('/').pop() || 'image.jpg';
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    })
    .catch((error) => {
      console.error('Download failed:', error);
    });
};

// SEO metadata
watchEffect(() => {
  if (!image.value || !uploader.value) {
    useHead({
      title: 'Image Not Found',
      meta: [
        {
          name: 'description',
          content: 'The requested image could not be found.',
        },
      ],
    });
    return;
  }

  const imageCaption = image.value.caption || image.value.alt || 'Image';
  const uploaderName = uploader.value.displayName || uploader.value.username;
  const serverName = config.serverDisplayName;

  const description = `Image uploaded by ${uploaderName}: ${imageCaption}${image.value.longDescription ? '. ' + image.value.longDescription : ''}`;

  useHead({
    title: `${imageCaption} by ${uploaderName} | ${serverName}`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: imageCaption },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image.value.url || '' },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: imageCaption },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image.value.url || '' },
    ],
  });
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('mouseleave', stopDrag);
  window.addEventListener('mousemove', onDrag);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('mouseleave', stopDrag);
  window.removeEventListener('mousemove', onDrag);
  document.body.style.overflow = '';
});
</script>

<template>
  <ClientOnly>
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Loading state -->
      <div v-if="imageLoading" class="flex h-96 items-center justify-center">
        <div class="text-lg">Loading image...</div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="imageError || !image"
        class="flex h-96 flex-col items-center justify-center text-center"
      >
        <h1 class="mb-4 text-2xl font-bold">Image Not Found</h1>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          The image you're looking for doesn't exist or has been removed.
        </p>
        <NuxtLink
          :to="`/u/${username}/images`"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Images
        </NuxtLink>
      </div>

      <!-- Wrong user page -->
      <div
        v-else-if="!isCorrectUserPage"
        class="flex h-96 flex-col items-center justify-center text-center"
      >
        <h1 class="mb-4 text-2xl font-bold">Invalid URL</h1>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          This image was uploaded by {{ uploader?.username }}, not
          {{ username }}.
        </p>
        <NuxtLink
          :to="`/u/${uploader?.username}/images/${imageId}`"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View on Correct Profile
        </NuxtLink>
      </div>

      <!-- Main content -->
      <div v-else class="space-y-6">
        <!-- Copied link notification -->
        <Notification
          :show="showCopiedLinkNotification"
          title="Link copied!"
        />
        <h1 class="text-2xl font-bold dark:text-white">
          Image uploaded by {{ uploader?.displayName || uploader?.username }}
          <span v-if="uploader?.displayName && uploader?.username" class="text-gray-500 dark:text-gray-400">
            ({{ uploader.username }})
          </span>
        </h1>

        <!-- Header with navigation and actions -->
        <div class="flex items-center justify-between">
          <NuxtLink
            :to="`/u/${username}/images`"
            class="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to {{ username }}'s Images
          </NuxtLink>

          <div class="flex items-center gap-2">
            <AddImageToFavorites
              v-if="image.id"
              :image-id="image.id"
              :image-title="image.caption || image.alt || 'Image'"
              size="medium"
            />

            <button
              v-if="usernameVar"
              type="button"
              class="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              @click="openAlbumSaveModal"
            >
              Save to album
            </button>

            <button
              v-if="usernameVar"
              type="button"
              class="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              @click="openCollectionSaveModal"
            >
              Save to collection
            </button>

            <button
              type="button"
              class="flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Copy link to clipboard"
              @click="copyImageLink"
            >
              <LinkIcon class="h-5 w-5" />
              Share
            </button>

            <button
              v-if="image.url"
              type="button"
              class="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              @click="downloadImage(image.url)"
            >
              <DownloadIcon class="h-5 w-5" />
              Download
            </button>
          </div>
        </div>

        <!-- Image display -->
        <div
          class="flex justify-center rounded-lg bg-gray-100 p-8 dark:bg-gray-800"
        >
          <ModelViewer
            v-if="image.url && hasGlbExtension(image.url)"
            :model-url="image.url"
            height="600px"
            width="800px"
            class="h-auto max-w-full"
          />
          <ClientOnly v-else-if="image.url && hasStlExtension(image.url)">
            <StlViewer
              :src="image.url"
              :width="800"
              :height="600"
              class="h-auto max-w-full"
            />
          </ClientOnly>
          <img
            v-else-if="image.url"
            :src="image.url"
            :alt="image.alt ?? 'Image'"
            class="h-auto max-w-full cursor-pointer rounded-lg shadow-lg"
            title="Click to view in lightbox"
            @click="openLightbox"
          >
        </div>

        <!-- Click hint for regular images -->
        <div
          v-if="
            image.url &&
            !hasGlbExtension(image.url) &&
            !hasStlExtension(image.url)
          "
          class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          💡 Click the image to view in fullscreen with zoom controls
        </div>

        <!-- Uploader info -->
        <div class="rounded-lg border bg-white p-6 dark:bg-gray-900">
          <h2 class="font-semibold mb-4 text-lg dark:text-gray-300">
            Uploader
          </h2>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <NuxtLink
                :to="`/u/${uploader?.username}`"
                class="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {{ uploader?.displayName || uploader?.username }}
              </NuxtLink>
              <div
                v-if="image.createdAt"
                class="mt-1 text-sm text-gray-600 dark:text-gray-400"
              >
                Uploaded on {{ new Date(image.createdAt).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Image details -->
        <div class="space-y-4">
          <!-- Caption section -->
          <div
            v-if="image.caption || isLoggedInUploader"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <div class="mb-3 flex items-center justify-between">
              <h2 class="font-semibold text-lg dark:text-gray-300">
                Caption
              </h2>
              <button
                v-if="isLoggedInUploader && editingField !== 'caption'"
                type="button"
                class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                @click="startEditingCaption"
              >
                <PencilIcon class="h-4 w-4" />
                Edit
              </button>
            </div>
            <div v-if="editingField === 'caption'">
              <TextEditor
                :initial-value="editingCaption"
                :allow-image-upload="false"
                placeholder="Write a caption..."
                :rows="3"
                @update="(text) => (editingCaption = text)"
              />
              <div class="mt-3 flex gap-2">
                <SaveButton
                  :disabled="updateLoading"
                  :loading="updateLoading"
                  @click="saveCaption"
                />
                <CancelButton @click="cancelEditing" />
              </div>
            </div>
            <div v-else-if="image.caption">
              <MarkdownPreview :text="image.caption" />
            </div>
            <p v-else class="italic text-gray-500 dark:text-gray-400">
              No caption added yet.
            </p>
          </div>

          <!-- Alt text section -->
          <div
            v-if="image.alt || isLoggedInUploader"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <div class="mb-3 flex items-center justify-between">
              <h2 class="font-semibold text-lg dark:text-gray-300">
                Alt Text
              </h2>
              <button
                v-if="isLoggedInUploader && editingField !== 'alt'"
                type="button"
                class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                @click="startEditingAlt"
              >
                <PencilIcon class="h-4 w-4" />
                Edit
              </button>
            </div>
            <div v-if="editingField === 'alt'">
              <textarea
                v-model="editingAlt"
                class="w-full rounded-lg border border-gray-300 p-3 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                rows="2"
                placeholder="Describe the image for accessibility..."
              />
              <div class="mt-3 flex gap-2">
                <SaveButton
                  :disabled="updateLoading"
                  :loading="updateLoading"
                  @click="saveAlt"
                />
                <CancelButton @click="cancelEditing" />
              </div>
            </div>
            <p v-else-if="image.alt" class="text-gray-700 dark:text-gray-300">
              {{ image.alt }}
            </p>
            <p v-else class="italic text-gray-500 dark:text-gray-400">
              No alt text added yet.
            </p>
          </div>

          <div
            v-if="image.longDescription"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
              Description
            </h2>
            <MarkdownPreview :text="image.longDescription" />
          </div>

          <div
            v-if="image.copyright"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
              Copyright
            </h2>
            <p class="text-gray-700 dark:text-gray-300">
              {{ image.copyright }}
            </p>
          </div>

          <!-- Warnings -->
          <div
            v-if="image.hasSensitiveContent || image.hasSpoiler"
            class="space-y-2"
          >
            <div
              v-if="image.hasSensitiveContent"
              class="rounded border border-yellow-200 bg-yellow-100 p-3 dark:border-yellow-700 dark:bg-yellow-900"
            >
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ This image contains sensitive content
              </p>
            </div>

            <div
              v-if="image.hasSpoiler"
              class="rounded border border-red-200 bg-red-100 p-3 dark:border-red-700 dark:bg-red-900"
            >
              <p class="text-sm text-red-800 dark:text-red-200">
                🚫 This image contains spoilers
              </p>
            </div>
          </div>

          <!-- Appears in albums -->
          <div
            v-if="hasAlbumUsage"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
              Appears in
            </h2>

            <div
              v-for="section in albumUsageSections"
              :key="section.title"
              class="space-y-3"
            >
              <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {{ section.title }}
              </h3>

              <div
                v-for="album in section.albums"
                :key="album.id"
                class="rounded-md border border-gray-200 p-3 dark:border-gray-700"
              >
                <NuxtLink
                  v-if="album.Owner?.username"
                  :to="`/u/${album.Owner.username}/albums/${album.id}`"
                  class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Album by {{ album.Owner.displayName || album.Owner.username }}
                  <span v-if="album.Owner.displayName">({{ album.Owner.username }})</span>
                </NuxtLink>
                <span
                  v-else
                  class="font-medium text-gray-700 dark:text-gray-300"
                >
                  Album by unknown user
                </span>

                <div
                  v-if="album.Discussions?.length && album.Discussions[0]"
                  class="mt-3 border-t pt-3 dark:border-gray-700"
                >
                  <p class="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    Related discussion:
                  </p>
                  <NuxtLink
                    v-if="album.Discussions[0]?.DiscussionChannels?.[0]?.channelUniqueName"
                    :to="`/forums/${album.Discussions[0]?.DiscussionChannels?.[0]?.channelUniqueName}/discussions/${album.Discussions[0]?.id}`"
                    class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {{ album.Discussions[0]?.title }}
                  </NuxtLink>
                  <span v-else class="text-gray-700 dark:text-gray-300">
                    {{ album.Discussions[0]?.title }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Other images in the album -->
            <div
              v-if="primaryAlbum && albumImages.length > 0"
              class="mt-4 border-t pt-4 dark:border-gray-700"
            >
              <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Other images in this album:
              </p>
              <AlbumThumbnailGrid
                :images="albumImages"
                :max-images="8"
                :show-captions="false"
                columns="grid-cols-4 sm:grid-cols-4 md:grid-cols-4"
              />
              <NuxtLink
                v-if="albumImages.length > 8 && primaryAlbum.Owner?.username"
                :to="`/u/${primaryAlbum.Owner.username}/albums/${primaryAlbum.id}`"
                class="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all {{ albumImages.length + 1 }} images in album
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showAlbumSaveModal"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-to-album-title"
      >
        <div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2
                id="save-to-album-title"
                class="text-xl font-semibold dark:text-white"
              >
                Save image to album
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add this image to one of your albums without re-uploading it.
                The original uploader attribution stays with the image.
              </p>
            </div>
            <button
              type="button"
              class="text-2xl leading-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close save to album dialog"
              @click="closeAlbumSaveModal"
            >
              ×
            </button>
          </div>

          <p
            v-if="albumSaveError"
            class="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          >
            {{ albumSaveError }}
          </p>

          <div v-if="userAlbumsLoading" class="py-6 text-center text-gray-600 dark:text-gray-400">
            Loading your albums...
          </div>

          <div
            v-else-if="userAlbums.length === 0"
            class="rounded border border-dashed border-gray-300 p-6 text-center dark:border-gray-700"
          >
            <p class="text-gray-700 dark:text-gray-300">
              You do not have any albums yet.
            </p>
            <NuxtLink
              :to="`/u/${usernameVar}/albums`"
              class="mt-3 inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              @click="closeAlbumSaveModal"
            >
              Go to your albums
            </NuxtLink>
          </div>

          <div v-else class="max-h-96 space-y-2 overflow-y-auto">
            <button
              v-for="album in userAlbums"
              :key="album.id"
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
              :disabled="
                addImageToAlbumLoading ||
                currentUserAlbumIdsContainingImage.has(album.id)
              "
              @click="saveImageToAlbum(album)"
            >
              <span>
                <span class="block font-medium text-gray-900 dark:text-gray-100">
                  {{ getAlbumDisplayName(album) }}
                </span>
                <span class="block text-sm text-gray-600 dark:text-gray-400">
                  {{ album.ImagesAggregate?.count || 0 }} images
                </span>
              </span>
              <span
                v-if="currentUserAlbumIdsContainingImage.has(album.id)"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                Already saved
              </span>
              <span v-else class="text-sm text-blue-600 dark:text-blue-400">
                Save
              </span>
            </button>
          </div>
        </div>
      </div>

      <AddToListPopover
        v-if="showCollectionSaveModal && imageId"
        :item-id="imageId"
        item-type="image"
        :is-visible="showCollectionSaveModal"
        variant="modal"
        @close="closeCollectionSaveModal"
      />

      <!-- Custom lightbox -->
      <div
        v-if="isLightboxOpen"
        class="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black"
      >
        <!-- Header controls -->
        <div
          class="absolute left-0 top-0 z-50 flex w-full items-center justify-between p-5 text-white"
        >
          <div class="flex items-center gap-4">
            <button
              class="bg-transparent cursor-pointer border-0 text-3xl text-white"
              @click="closeLightbox"
            >
              ×
            </button>
          </div>

          <div class="flex items-center gap-4">
            <!-- Zoom controls -->
            <div class="flex items-center rounded bg-opacity-10">
              <button
                class="cursor-pointer px-2 py-1 text-white transition-colors hover:bg-opacity-20"
                :class="{ 'cursor-not-allowed opacity-50': zoomLevel <= 1 }"
                title="Zoom out"
                :disabled="zoomLevel <= 1"
                @click="zoomOut"
              >
                −
              </button>
              <span class="px-2 text-sm text-white">
                {{ Math.round(zoomLevel * 100) }}%
              </span>
              <button
                class="cursor-pointer px-2 py-1 text-white transition-colors hover:bg-opacity-20"
                :class="{ 'cursor-not-allowed opacity-50': zoomLevel >= 3 }"
                title="Zoom in"
                :disabled="zoomLevel >= 3"
                @click="zoomIn"
              >
                +
              </button>
              <button
                v-if="isZoomed"
                class="cursor-pointer px-2 py-1 text-white transition-colors hover:bg-opacity-20"
                title="Reset zoom"
                @click="resetZoom"
              >
                Reset
              </button>
            </div>

            <!-- Download button -->
            <button
              type="button"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-xl text-white no-underline hover:bg-white hover:bg-opacity-20"
              @click="() => downloadImage(image?.url || '')"
            >
              <DownloadIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- Image container -->
        <div
          class="relative flex h-full w-full items-center justify-center overflow-hidden"
        >
          <ModelViewer
            v-if="image && image.url && hasGlbExtension(image.url)"
            :model-url="image.url"
            height="100%"
            width="100%"
            class="h-full w-full object-contain transition-all duration-300 ease-in-out"
            :style="{
              transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
            }"
            @mousedown="startDrag"
          />
          <div
            v-else-if="image && image.url && hasStlExtension(image.url)"
            class="flex h-full w-full items-center justify-center"
            :style="{
              transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
            }"
            @mousedown="startDrag"
          >
            <ClientOnly>
              <StlViewer
                :src="image.url"
                :width="800"
                :height="600"
                class="object-contain transition-all duration-300 ease-in-out"
              />
            </ClientOnly>
          </div>
          <img
            v-else-if="image && image.url"
            :src="image.url"
            :alt="image.alt ?? 'Image'"
            class="h-full w-full object-contain transition-all duration-300 ease-in-out"
            :style="{
              transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
            }"
            @mousedown="startDrag"
          >
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
