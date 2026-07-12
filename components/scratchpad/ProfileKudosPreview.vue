<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_PUBLIC_SCRATCHPAD_ENTRIES } from '@/graphQLData/scratchpad/queries';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { relativeTime } from '@/utils';

const PREVIEW_LIMIT = 4;
const VISIBLE_PREVIEW_LIMIT = 3;

type ScratchpadPreviewEntry = {
  id: string;
  createdAt: string;
  text: string;
  Author?: {
    username?: string;
    displayName?: string;
  } | null;
};

const props = defineProps<{
  username: string;
}>();

const {
  result,
  loading,
  error,
} = useQuery(
  GET_PUBLIC_SCRATCHPAD_ENTRIES,
  () => ({
    username: props.username,
    limit: PREVIEW_LIMIT,
    offset: 0,
  }),
  {
    enabled: computed(() => !!props.username),
    fetchPolicy: 'cache-first',
  }
);

const publicEntries = computed<ScratchpadPreviewEntry[]>(() => {
  return (result.value?.scratchpadEntries ?? []) as ScratchpadPreviewEntry[];
});

const publicKudosCount = computed(() => {
  return (
    result.value?.scratchpadEntriesAggregate?.count ??
    publicEntries.value.length ??
    0
  );
});

const previewEntries = computed(() => {
  return publicEntries.value.slice(0, VISIBLE_PREVIEW_LIMIT);
});

const shouldShowSection = computed(() => {
  return publicKudosCount.value > 0;
});

const shouldShowSeeAllLink = computed(() => {
  return publicKudosCount.value > VISIBLE_PREVIEW_LIMIT;
});

const kudosPageLink = computed(() => `/u/${props.username}/kudos`);
</script>

<template>
  <section
    v-if="shouldShowSection || loading || error"
    class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
    data-testid="profile-kudos-preview"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Kudos</h2>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ publicKudosCount }}
      </span>
    </div>

    <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
      Loading...
    </div>

    <ErrorBanner v-else-if="error" :text="error.message" />

    <div v-else class="space-y-3">
      <article
        v-for="entry in previewEntries"
        :key="entry.id"
        class="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
        data-testid="profile-kudos-preview-entry"
      >
        <div class="mb-1 flex items-center justify-between gap-2">
          <NuxtLink
            :to="`/u/${entry.Author?.username}`"
            class="truncate text-sm font-medium text-gray-900 hover:underline dark:text-white"
          >
            {{ entry.Author?.displayName || entry.Author?.username || 'Unknown' }}
          </NuxtLink>
          <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {{ relativeTime(entry.createdAt) }}
          </span>
        </div>
        <p class="line-clamp-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
          {{ entry.text }}
        </p>
      </article>

      <NuxtLink
        v-if="shouldShowSeeAllLink"
        :to="kudosPageLink"
        class="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
        data-testid="profile-kudos-see-all"
      >
        <span>See all kudos</span>
        <RightArrowIcon class="h-4 w-4" />
      </NuxtLink>
    </div>
  </section>
</template>
