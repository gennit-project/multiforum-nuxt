<script lang="ts" setup>
import { computed, watchEffect, ref, onMounted, onUnmounted } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useRoute, useHead } from 'nuxt/app';
import { GET_IMAGE_DETAILS } from '@/graphQLData/image/queries';
import { UPDATE_IMAGE } from '@/graphQLData/discussion/mutations';
import type { Image } from '@/__generated__/graphql';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import AddImageToFavorites from '@/components/favorites/AddImageToFavorites.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';
import { usernameVar } from '@/cache';
import TextEditor from '@/components/TextEditor.vue';
import SaveButton from '@/components/SaveButton.vue';
import CancelButton from '@/components/CancelButton.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import AlbumThumbnailGrid from '@/components/album/AlbumThumbnailGrid.vue';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  ssr: false,
});

const route = useRoute();

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

const image = computed((): Image | null => {
  if (imageError.value) return null;
  if (imageResult.value && imageResult.value.images.length > 0) {
    return imageResult.value.images[0];
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

// Album discussions - discussions that use the album containing this image
const albumDiscussions = computed(() => {
  return image.value?.Album?.Discussions || [];
});

// Album images - ordered according to imageOrder, excluding current image
const albumImages = computed(() => {
  const album = image.value?.Album;
  if (!album?.Images) return [];

  const images = album.Images;
  const imageOrder = album.imageOrder;

  // Order images according to imageOrder if available
  let orderedImages;
  if (imageOrder && imageOrder.length > 0) {
    orderedImages = imageOrder
      .filter((imgId): imgId is string => imgId !== null && imgId !== undefined)
      .map((imgId) => images.find((img) => img.id === imgId))
      .filter((img): img is NonNullable<typeof img> => img !== undefined);
  } else {
    orderedImages = images;
  }

  // Exclude the current image from the list
  return orderedImages.filter((img) => img.id !== image.value?.id);
});

// Custom lightbox state
const isLightboxOpen = ref(false);

// Zoom functionality
const zoomLevel = ref(1);
const isZoomed = computed(() => zoomLevel.value > 1);

// Image panning
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const translateX = ref(0);
const translateY = ref(0);

const startDrag = (event: MouseEvent) => {
  if (!isZoomed.value) return;

  if (event.button !== 0) return;

  event.preventDefault();
  isDragging.value = true;
  startX.value = event.clientX - translateX.value;
  startY.value = event.clientY - translateY.value;
};

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;

  event.preventDefault();
  translateX.value = event.clientX - startX.value;
  translateY.value = event.clientY - startY.value;
};

const stopDrag = () => {
  isDragging.value = false;
};

// Reset translation when changing zoom
const resetTranslation = () => {
  translateX.value = 0;
  translateY.value = 0;
};

// Lightbox functions
const openLightbox = () => {
  if (
    image.value?.url &&
    !hasGlbExtension(image.value.url) &&
    !hasStlExtension(image.value.url)
  ) {
    isLightboxOpen.value = true;
    zoomLevel.value = 1;
    resetTranslation();
    document.body.style.overflow = 'hidden';
  }
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
  zoomLevel.value = 1;
  resetTranslation();
  document.body.style.overflow = '';
};

// Zoom functions
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.5;
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 1) {
    zoomLevel.value -= 0.5;
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  resetTranslation();
};

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (isLightboxOpen.value) {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === '+') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  }
};

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
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME || 'Multiforum';

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
            class="h-auto max-w-full cursor-pointer rounded-lg shadow-lg transition-transform hover:scale-105"
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

          <!-- Appears in album -->
          <div
            v-if="image.Album && uploader?.username"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
              Appears in
            </h2>
            <NuxtLink
              :to="`/u/${uploader.username}/albums/${image.Album.id}`"
              class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Album by {{ uploader.displayName || uploader.username }}
              <span v-if="uploader.displayName">({{ uploader.username }})</span>
            </NuxtLink>
            <div
              v-if="albumDiscussions.length > 0 && albumDiscussions[0]"
              class="mt-3 border-t pt-3 dark:border-gray-700"
            >
              <p class="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Related discussion:
              </p>
              <NuxtLink
                :to="`/forums/${albumDiscussions[0]?.DiscussionChannels?.[0]?.channelUniqueName}/discussions/${albumDiscussions[0]?.id}`"
                class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {{ albumDiscussions[0]?.title }}
              </NuxtLink>
            </div>
            <!-- Other images in the album -->
            <div
              v-if="albumImages.length > 0"
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
                v-if="albumImages.length > 8"
                :to="`/u/${uploader.username}/albums/${image.Album.id}`"
                class="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all {{ albumImages.length + 1 }} images in album
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

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
