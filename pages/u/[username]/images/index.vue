<script lang="ts" setup>
import { computed, ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";
import { GET_USER_IMAGES } from "@/graphQLData/image/queries";
import type { Image } from "@/__generated__/graphql";
import ModelViewer from "@/components/ModelViewer.vue";
import StlViewer from "@/components/download/StlViewer.vue";

const route = useRoute();

const username = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});

const pageSize = 24; // Show 24 images per page
const currentOffset = ref(0);

const {
  result: userImagesResult,
  loading: userImagesLoading,
  error: userImagesError,
  fetchMore,
} = useQuery(
  GET_USER_IMAGES,
  () => ({
    username: username.value,
    offset: 0,
    limit: pageSize,
  }),
  {
    fetchPolicy: "cache-first",
  }
);

const user = computed(() => {
  if (userImagesLoading.value || userImagesError.value) return null;
  if (userImagesResult.value && userImagesResult.value.users.length > 0) {
    return userImagesResult.value.users[0];
  }
  return null;
});

const images = computed((): Image[] => {
  if (!user.value?.Images) return [];
  return user.value.Images;
});

const hasMoreImages = computed(() => {
  // If we got a full page of results, there might be more
  return images.value.length === currentOffset.value + pageSize && images.value.length >= pageSize;
});

const loadMoreImages = async () => {
  if (!hasMoreImages.value || userImagesLoading.value) return;
  
  const newOffset = currentOffset.value + pageSize;

  try {
    await fetchMore({
      variables: {
        username: username.value,
        offset: newOffset,
        limit: pageSize,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;
        
        const newImages = fetchMoreResult.users[0].Images;
        
        return {
          ...previousResult,
          users: [
            {
              ...previousResult.users[0],
              Images: [
                ...previousResult.users[0].Images,
                ...newImages,
              ],
            },
          ],
        };
      },
    });
    
    currentOffset.value = newOffset;
  } catch (error) {
    console.error("Error loading more images:", error);
  }
};

// Check file types
const hasGlbExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.glb');
};

const hasStlExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.stl');
};

const getImageAlt = (image: Image) => {
  return image.alt || image.caption || 'Image';
};
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Images by {{ username }}</h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ images.length }} {{ images.length === 1 ? 'image' : 'images' }} {{ hasMoreImages ? '(showing more as you scroll)' : 'uploaded' }}
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="userImagesLoading && images.length === 0" class="flex justify-center items-center h-64">
      <div class="text-lg">Loading images...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="userImagesError" class="flex flex-col justify-center items-center h-64 text-center">
      <h2 class="text-xl font-bold mb-4">Error Loading Images</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        There was an error loading the images. Please try again later.
      </p>
    </div>

    <!-- No images state -->
    <div v-else-if="images.length === 0" class="flex flex-col justify-center items-center h-64 text-center">
      <h2 class="text-xl font-bold mb-4">No Images Yet</h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ username }} hasn't uploaded any images yet.
      </p>
    </div>

    <!-- Images grid -->
    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="image in images"
          :key="image.id"
          class="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <NuxtLink :to="`/u/${username}/images/${image.id}`" class="block">
            <!-- Image container with fixed aspect ratio -->
            <div class="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <!-- 3D Model viewer for GLB files -->
              <ModelViewer
                v-if="image.url && hasGlbExtension(image.url)"
                :model-url="image.url"
                height="100%"
                width="100%"
                class="w-full h-full object-cover"
              />
              <!-- STL viewer for STL files -->
              <StlViewer
                v-else-if="image.url && hasStlExtension(image.url)"
                :src="image.url"
                :width="300"
                :height="300"
                class="w-full h-full object-cover"
              />
              <!-- Regular image -->
              <img
                v-else-if="image.url"
                :src="image.url"
                :alt="getImageAlt(image)"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              
              <!-- Overlay with sensitive content warning -->
              <div
                v-if="image.hasSensitiveContent || image.hasSpoiler"
                class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <div class="text-white text-center p-2">
                  <div v-if="image.hasSensitiveContent" class="text-xs">⚠️ Sensitive</div>
                  <div v-if="image.hasSpoiler" class="text-xs">🚫 Spoiler</div>
                </div>
              </div>
            </div>

            <!-- Card content -->
            <div class="p-4">
              <div v-if="image.caption" class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                {{ image.caption }}
              </div>
              <div v-else-if="image.alt" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {{ image.alt }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-500">
                {{ new Date(image.createdAt).toLocaleDateString() }}
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Load more button -->
      <div v-if="hasMoreImages" class="flex justify-center">
        <button
          type="button"
          :disabled="userImagesLoading"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="loadMoreImages"
        >
          <span v-if="userImagesLoading">Loading...</span>
          <span v-else>Load More Images</span>
        </button>
      </div>
    </div>
  </div>
</template>