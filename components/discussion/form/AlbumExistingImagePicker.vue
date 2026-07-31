<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useUsername } from '@/composables/useAuthState';
import AlbumReusableUserImagesTab from './AlbumReusableUserImagesTab.vue';
import AlbumReusableCollectionsTab from './AlbumReusableCollectionsTab.vue';
import type { ReusableImage } from './reusableImageTypes';

type TabKey = 'uploads' | 'favorites' | 'collections';

const props = defineProps<{
  selectedImageIds: string[];
  isLimitReached: boolean;
}>();

const emit = defineEmits<{
  addImage: [image: ReusableImage];
  close: [];
}>();

const usernameVar = useUsername();
const hasUsername = computed(() => Boolean(usernameVar.value));

const searchTerm = ref('');
const activeTab = ref<TabKey>('uploads');

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'uploads', label: 'Your uploads' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'collections', label: 'Collections' },
];

const searchPlaceholder = computed(() =>
  activeTab.value === 'collections'
    ? 'Search collections and their images'
    : 'Search by caption, alt text, URL, or image ID'
);
</script>

<template>
  <section
    class="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-900/40"
    aria-labelledby="existing-image-picker-heading"
  >
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h4
          id="existing-image-picker-heading"
          class="text-sm font-semibold text-gray-900 dark:text-white"
        >
          Add an existing image
        </h4>
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Reuse images from your uploads, favorites, or image collections without
          re-uploading. Original uploader attribution is preserved.
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="Close reusable image picker"
        @click="emit('close')"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <p
      v-if="!hasUsername"
      class="mt-3 text-sm text-gray-600 dark:text-gray-300"
    >
      Sign in to reuse images from your uploads, favorites, and collections.
    </p>

    <template v-else>
      <div
        class="mb-3 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        aria-label="Reusable image sources"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :class="[
            'rounded-t-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30',
            activeTab === tab.key
              ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <label
        class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
        for="existing-image-search"
      >
        Search reusable images
      </label>
      <input
        id="existing-image-search"
        v-model="searchTerm"
        type="search"
        class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        :placeholder="searchPlaceholder"
      >

      <div class="max-h-96 overflow-y-auto">
        <AlbumReusableUserImagesTab
          v-if="activeTab === 'uploads'"
          source="uploads"
          :search-term="searchTerm"
          :selected-image-ids="props.selectedImageIds"
          :is-limit-reached="props.isLimitReached"
          @add-image="emit('addImage', $event)"
        />
        <AlbumReusableUserImagesTab
          v-else-if="activeTab === 'favorites'"
          source="favorites"
          :search-term="searchTerm"
          :selected-image-ids="props.selectedImageIds"
          :is-limit-reached="props.isLimitReached"
          @add-image="emit('addImage', $event)"
        />
        <AlbumReusableCollectionsTab
          v-else
          :search-term="searchTerm"
          :selected-image-ids="props.selectedImageIds"
          :is-limit-reached="props.isLimitReached"
          @add-image="emit('addImage', $event)"
        />
      </div>
    </template>
  </section>
</template>
