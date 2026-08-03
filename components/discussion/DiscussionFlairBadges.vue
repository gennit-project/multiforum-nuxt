<script setup lang="ts">
import { computed } from 'vue';
import type { DiscussionFlairData } from '@/types/Discussion';

const props = withDefaults(
  defineProps<{
    flairs: DiscussionFlairData[];
    channelName?: string;
    showChannelName?: boolean;
  }>(),
  {
    channelName: '',
    showChannelName: false,
  }
);

const orderedFlairs = computed(() =>
  [...props.flairs].sort(
    (left, right) =>
      left.order - right.order || left.displayName.localeCompare(right.displayName)
  )
);
</script>

<template>
  <ul
    v-if="orderedFlairs.length"
    class="flex flex-wrap gap-1.5"
    :aria-label="
      channelName ? `Post flairs for ${channelName}` : 'Post flairs'
    "
  >
    <li
      v-for="flair in orderedFlairs"
      :key="flair.id"
      data-testid="discussion-flair"
      class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      :title="flair.archived ? 'Archived flair' : undefined"
    >
      <span
        v-if="flair.color"
        aria-hidden="true"
        class="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
        :style="{ backgroundColor: flair.color }"
      />
      <span>{{
        showChannelName && channelName
          ? `${channelName}: ${flair.displayName}`
          : flair.displayName
      }}</span>
    </li>
  </ul>
</template>
