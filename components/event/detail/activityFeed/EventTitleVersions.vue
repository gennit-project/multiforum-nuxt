<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import type { Event } from '@/__generated__/graphql';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import { timeAgo } from '@/utils';

interface TitleTransition {
  id: string;
  author: string;
  oldTitle: string;
  newTitle: string;
  timestamp: Date;
  isLatest: boolean;
}

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: true,
  },
});

const showOlderEdits = ref(false);

// Process the past title versions into old -> new transitions, oldest first.
const titleVersionsWithCurrent = computed((): TitleTransition[] => {
  if (
    !props.event?.PastTitleVersions ||
    props.event.PastTitleVersions.length === 0
  ) {
    return [];
  }

  // PastTitleVersions come back newest-first; reverse for chronological order.
  const pastVersions = props.event.PastTitleVersions.slice().reverse();

  const transitions: TitleTransition[] = [];

  for (let i = 0; i < pastVersions.length; i++) {
    const oldVersion = pastVersions[i];
    const newerVersion =
      i === pastVersions.length - 1
        ? { body: props.event.title }
        : pastVersions[i + 1];

    transitions.push({
      id: oldVersion?.id || '',
      author: oldVersion?.Author?.username || '[Deleted]',
      oldTitle: oldVersion?.body || '',
      newTitle: newerVersion?.body || '',
      timestamp: new Date(oldVersion?.createdAt || Date.now()),
      isLatest: i === pastVersions.length - 1,
    });
  }

  return transitions;
});

const showActivityFeed = computed(() => {
  return titleVersionsWithCurrent.value.length > 0;
});

const visibleItems = computed((): TitleTransition[] => {
  if (showOlderEdits.value || titleVersionsWithCurrent.value.length <= 1) {
    return titleVersionsWithCurrent.value;
  }
  const lastItem =
    titleVersionsWithCurrent.value[titleVersionsWithCurrent.value.length - 1];
  return lastItem ? [lastItem] : [];
});

const hiddenCount = computed(() => {
  return titleVersionsWithCurrent.value.length - 1;
});

const toggleOlderEdits = () => {
  showOlderEdits.value = !showOlderEdits.value;
};
</script>

<template>
  <div v-if="showActivityFeed" class="mb-6 mt-4">
    <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
      Title Edit History
    </p>
    <ul role="list" class="flow-root">
      <li v-if="hiddenCount > 0 && !showOlderEdits" class="relative pb-4">
        <div class="relative flex items-center space-x-3">
          <div class="relative flex h-6 w-6 items-center justify-center">
            <span
              class="absolute top-3 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
          </div>
          <button
            class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            @click="toggleOlderEdits"
          >
            Show {{ hiddenCount }} older edit{{ hiddenCount > 1 ? 's' : '' }}
          </button>
        </div>
      </li>

      <li
        v-for="(item, index) in visibleItems"
        :key="item.id"
        class="relative pb-4"
      >
        <div class="relative flex items-center space-x-3">
          <div class="relative flex h-6 w-6 items-center justify-center">
            <span
              v-if="index > 0 || (showOlderEdits && hiddenCount > 0)"
              class="absolute bottom-3 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
            <span
              v-if="index < visibleItems.length - 1"
              class="absolute top-3 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
            <div
              class="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white dark:bg-gray-700 dark:ring-gray-800"
            >
              <PencilIcon
                class="h-3 w-3 text-gray-500 dark:text-gray-300"
                aria-hidden="true"
              />
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="text-xs leading-6">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                item.author
              }}</span>
              <span class="text-gray-500 dark:text-gray-400">
                changed the title
              </span>
              <span class="text-gray-500 line-through dark:text-gray-400">{{
                item.oldTitle
              }}</span>
              <span class="text-gray-500 dark:text-gray-400"> → </span>
              <span class="text-gray-900 dark:text-gray-200">{{
                item.newTitle
              }}</span>
              <span
                class="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"
              >
                {{ timeAgo(item.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </li>

      <li v-if="hiddenCount > 0 && showOlderEdits" class="relative">
        <div class="relative flex items-center space-x-3">
          <div class="flex h-6 w-6 items-center justify-center" />
          <button
            class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            @click="toggleOlderEdits"
          >
            Hide older edits
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
