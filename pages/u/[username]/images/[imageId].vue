<script lang="ts" setup>
import { computed, watchEffect } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useHead } from 'nuxt/app';
import { GET_IMAGE_DETAILS } from '@/graphQLData/image/queries';
import type { Image } from '@/__generated__/graphql';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';

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
  {
    imageId: imageId.value,
  },
  {
    enabled: !!imageId.value,
    fetchPolicy: 'network-only',
  }
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

// Check file types
const hasGlbExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.glb');
};

const hasStlExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.stl');
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
      description: 'The requested image could not be found.',
    });
    return;
  }

  const imageCaption = image.value.caption || image.value.alt || 'Image';
  const uploaderName = uploader.value.displayName || uploader.value.username;
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;

  useHead({
    title: `${imageCaption} by ${uploaderName} | ${serverName}`,
    description: `Image uploaded by ${uploaderName}: ${imageCaption}${image.value.longDescription ? '. ' + image.value.longDescription : ''}`,
    image: image.value.url || '',
  });
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
        <!-- Header with navigation and actions -->
        <div class="flex items-center justify-between">
          <NuxtLink
            :to="`/u/${username}/images`"
            class="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to {{ username }}'s Images
          </NuxtLink>

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
            class="h-auto max-w-full rounded-lg shadow-lg"
          />
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
          <div
            v-if="image.caption"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
              Caption
            </h2>
            <MarkdownPreview :text="image.caption" />
          </div>

          <div
            v-if="image.alt"
            class="rounded-lg border bg-white p-6 dark:bg-gray-900"
          >
            <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
              Alt Text
            </h2>
            <p class="text-gray-700 dark:text-gray-300">{{ image.alt }}</p>
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
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
