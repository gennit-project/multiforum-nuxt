<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { Collection, Discussion } from '@/__generated__/graphql';
import CollectionDownloadListItem from '@/components/collection/CollectionDownloadListItem.vue';

const props = defineProps({
  collection: {
    type: Object as PropType<Partial<Collection>>,
    required: true,
  },
});

const firstDownloads = computed<Discussion[]>(() => {
  return (props.collection?.Downloads || []).slice(0, 5) as Discussion[];
});

const creatorLabel = computed(() => {
  const creator = props.collection?.CreatedBy;
  if (!creator) return 'Unknown user';
  if (creator.displayName) {
    return `${creator.displayName} (${creator.username})`;
  }
  return creator.username || 'Unknown user';
});
</script>

<template>
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-400"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <NuxtLink
          :to="`/collections/${collection.id}`"
          class="font-semibold truncate text-sm text-gray-900 hover:text-orange-600 dark:text-white"
        >
          {{ collection.name }}
        </NuxtLink>
        <p class="text-xs text-gray-600 dark:text-gray-300">
          by {{ creatorLabel }}
        </p>
        <p class="text-xs text-gray-600 dark:text-gray-300">
          {{ collection.itemCount || 0 }} items
        </p>
      </div>
      <NuxtLink
        :to="`/collections/${collection.id}`"
        class="text-xs font-medium text-orange-700 hover:underline dark:text-orange-300"
      >
        View all
      </NuxtLink>
    </div>

    <p
      v-if="collection.description"
      class="mt-2 text-xs text-gray-600 dark:text-gray-300"
    >
      {{ collection.description }}
    </p>

    <div class="mt-3">
      <ul
        v-if="firstDownloads.length"
        class="mt-2 flex gap-3 overflow-x-auto pb-1"
      >
        <CollectionDownloadListItem
          v-for="download in firstDownloads"
          :key="download.id"
          :discussion="download"
        />
      </ul>
      <p v-else class="mt-2 text-xs text-gray-600 dark:text-gray-400">
        No downloads in this collection yet.
      </p>
    </div>
  </div>
</template>
