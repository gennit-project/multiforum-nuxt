<script setup lang="ts">
import { computed } from 'vue';
import type { Collection } from '@/__generated__/graphql';
import { getCollectionTypeLabel } from '@/utils/collectionItemUtils';

const props = defineProps<{
  collection: Partial<Collection> | null;
  showEmbedNotice?: boolean;
}>();

const collectionLink = computed(() => {
  if (!props.collection?.id) return null;
  return `/collections/${props.collection.id}`;
});

const ownerName = computed(() => {
  const owner = props.collection?.CreatedBy;
  return owner?.displayName || owner?.username || 'Unknown user';
});

const typeLabel = computed(() =>
  getCollectionTypeLabel(props.collection?.collectionType)
);
</script>

<template>
  <div
    class="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="mb-2 flex items-center justify-between">
      <p
        class="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400"
      >
        Shared Collection
      </p>
      <span
        class="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-300"
      >
        {{ typeLabel }}
      </span>
    </div>
    <div class="space-y-1">
      <nuxt-link
        v-if="collectionLink"
        :to="collectionLink"
        class="font-semibold block text-lg text-gray-900 hover:underline dark:text-white"
      >
        {{ collection?.name }}
      </nuxt-link>
      <p v-else class="font-semibold text-lg text-gray-900 dark:text-white">
        {{ collection?.name }}
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Curated by <span class="font-semibold">{{ ownerName }}</span>
        <span> · {{ collection?.itemCount || 0 }} items</span>
      </p>
      <p
        v-if="collection?.description"
        class="text-sm text-gray-700 dark:text-gray-200"
      >
        {{ collection.description }}
      </p>
      <p v-else class="text-sm text-gray-500 dark:text-gray-300">
        No description provided.
      </p>
    </div>
    <p
      v-if="showEmbedNotice"
      class="bg-gray-50 mt-3 rounded-md px-3 py-2 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200"
    >
      This public collection will be embedded with your discussion. Readers can
      open the collection from the published post.
    </p>
  </div>
</template>
