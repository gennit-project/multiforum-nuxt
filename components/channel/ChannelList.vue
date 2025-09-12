<script lang="ts" setup>
import type { PropType } from 'vue';
import type { Channel } from '@/__generated__/graphql';
import ChannelListItem from '@/components/channel/ChannelListItem.vue';
import LoadMore from '@/components/LoadMore.vue';

// Define props
defineProps({
  channels: {
    type: Array as PropType<Array<Channel & { downloadCount?: number }>>,
    default: () => [],
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  searchInput: {
    type: String,
    default: '',
  },
  selectedTags: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['filterByTag', 'loadMore']);

function filterByTag(tag: string) {
  emit('filterByTag', tag);
}
</script>

<template>
  <div>
    <p
      v-if="channels.length === 0"
      class="mt-2 text-sm font-normal dark:text-white"
    >
      There are no results.
    </p>
    <!-- Mobile layout: single column with dividers -->
    <div class="block divide-y divide-gray-300 dark:divide-gray-600 md:hidden">
      <ChannelListItem
        v-for="channel in channels"
        :key="channel.uniqueName"
        :channel="channel"
        :download-count="channel.downloadCount || 0"
        :search-input="searchInput"
        :selected-tags="selectedTags"
        @filter-by-tag="filterByTag"
      />
    </div>
    <!-- Desktop layout: masonry columns -->
    <div class="hidden columns-1 gap-4 sm:columns-2 md:block lg:columns-3">
      <ChannelListItem
        v-for="channel in channels"
        :key="channel.uniqueName"
        :channel="channel"
        :download-count="channel.downloadCount || 0"
        :search-input="searchInput"
        :selected-tags="selectedTags"
        @filter-by-tag="filterByTag"
      />
    </div>
    <div class="m-10 grid justify-items-stretch">
      <LoadMore
        class="justify-self-center font-normal"
        :loading="loading"
        :reached-end-of-results="resultCount === channels.length"
        @load-more="$emit('loadMore')"
      />
    </div>
  </div>
</template>

<style scoped></style>
