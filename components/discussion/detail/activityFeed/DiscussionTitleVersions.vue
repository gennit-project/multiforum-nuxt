<script setup lang="ts">
  import { computed } from "vue";
  import type { PropType } from "vue";
  import type { Discussion } from "@/__generated__/graphql";
  import { timeAgo } from "@/utils";

  const props = defineProps({
    discussion: {
      type: Object as PropType<Discussion>,
      required: true,
    },
  });

  // Process the past title versions
  const titleVersionsWithCurrent = computed(() => {
    if (!props.discussion?.PastTitleVersions || props.discussion.PastTitleVersions.length === 0) {
      return [];
    }

    // Get past versions ordered by newest first (they should already be in this order)
    const pastVersions = props.discussion.PastTitleVersions.slice();

    // Create an array of title transitions:
    // [current <- past version N <- ... <- past version 1]
    const transitions = [];

    // Add transitions between past versions
    for (let i = 0; i < pastVersions.length; i++) {
      const oldVersion = pastVersions[i];
      const newerVersion = i === 0 ? { body: props.discussion.title } : pastVersions[i - 1];

      transitions.push({
        id: oldVersion.id,
        author: oldVersion.Author?.username || "[Deleted]",
        oldTitle: oldVersion.body,
        newTitle: newerVersion.body,
        timestamp: new Date(oldVersion.createdAt),
        isLatest: i === 0,
      });
    }

    return transitions;
  });

  // Show the activity feed only if there are past title versions
  const showActivityFeed = computed(() => {
    return titleVersionsWithCurrent.value.length > 0;
  });
</script>

<template>
  <div
    v-if="showActivityFeed"
    class="mb-6 mt-4"
  >
    <h3 class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Title Edit History</h3>
    <ul
      role="list"
      class="flow-root"
    >
      <li
        v-for="item in titleVersionsWithCurrent"
        :key="item.id"
        class="relative pb-6"
      >
        <div class="relative flex items-start space-x-3">
          <!-- Activity icon -->
          <div class="relative">
            <span
              class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-800"
            >
              <i
                class="fa-solid fa-pencil text-gray-500 dark:text-gray-300"
                aria-hidden="true"
              />
            </div>
          </div>

          <!-- Activity content -->
          <div class="min-w-0 flex-1">
            <div class="text-xs leading-6">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{ item.author }}</span>
              <span class="text-gray-500 dark:text-gray-400"> changed the title </span>
              <span class="text-gray-500 line-through dark:text-gray-400">{{ item.oldTitle }}</span>
              <span class="text-gray-500 dark:text-gray-400"> → </span>
              <span class="text-gray-900 dark:text-gray-200">{{ item.newTitle }}</span>
              <span class="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                {{ timeAgo(item.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
