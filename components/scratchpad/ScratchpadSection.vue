<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GET_PUBLIC_SCRATCHPAD_ENTRIES,
  GET_PENDING_SCRATCHPAD_ENTRIES,
} from '@/graphQLData/scratchpad/queries';
import ScratchpadEntry from './ScratchpadEntry.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadMore from '@/components/LoadMore.vue';
import { useUsername } from '@/composables/useAuthState';

const PUBLIC_KUDOS_PAGE_LIMIT = 10;

const usernameVar = useUsername();

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
});

const isOwner = computed(() => usernameVar.value === props.username);

// Fetch public entries (visible to everyone)
const {
  result: publicResult,
  loading: publicLoading,
  error: publicError,
  refetch: refetchPublic,
  fetchMore: fetchMorePublic,
} = useQuery(GET_PUBLIC_SCRATCHPAD_ENTRIES, () => ({
  username: props.username,
  limit: PUBLIC_KUDOS_PAGE_LIMIT,
  offset: 0,
}));

// Fetch pending entries (only for owner)
const {
  result: pendingResult,
  loading: pendingLoading,
  error: pendingError,
  refetch: refetchPending,
} = useQuery(
  GET_PENDING_SCRATCHPAD_ENTRIES,
  () => ({
    username: props.username,
  }),
  {
    enabled: isOwner,
  }
);

const publicEntries = computed(() => publicResult.value?.scratchpadEntries || []);
const publicEntriesAggregateCount = computed(() => {
  return (
    publicResult.value?.scratchpadEntriesAggregate?.count ??
    publicEntries.value.length ??
    0
  );
});
const pendingEntries = computed(() => pendingResult.value?.scratchpadEntries || []);

const hasPendingEntries = computed(
  () => isOwner.value && pendingEntries.value.length > 0
);
const hasPublicEntries = computed(() => publicEntries.value.length > 0);
const hasNoEntries = computed(
  () => !publicLoading.value && !hasPublicEntries.value && !hasPendingEntries.value
);

const loading = computed(() => publicLoading.value || (isOwner.value && pendingLoading.value));
const showLoadMore = computed(() => {
  return publicEntriesAggregateCount.value > publicEntries.value.length;
});

const loadMorePublicEntries = async () => {
  await fetchMorePublic({
    variables: {
      username: props.username,
      limit: PUBLIC_KUDOS_PAGE_LIMIT,
      offset: publicEntries.value.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) {
        return previousResult;
      }

      return {
        ...fetchMoreResult,
        scratchpadEntries: [
          ...(previousResult.scratchpadEntries || []),
          ...(fetchMoreResult.scratchpadEntries || []),
        ],
      };
    },
  });
};

const handleEntryUpdated = () => {
  refetchPublic();
  if (isOwner.value) {
    refetchPending();
  }
};

const handleEntryDeleted = () => {
  refetchPublic();
  if (isOwner.value) {
    refetchPending();
  }
};
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <i class="fa-solid fa-spinner fa-spin text-2xl text-gray-400" />
    </div>

    <!-- Error state -->
    <ErrorBanner v-if="publicError" :text="publicError.message" class="mb-4" />
    <ErrorBanner v-if="pendingError" :text="pendingError.message" class="mb-4" />

    <template v-if="!loading">
      <!-- Empty state -->
      <div
        v-if="hasNoEntries"
        class="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600"
      >
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-indigo-900/30"
        >
          <i
            class="fa-solid fa-star text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
          />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          No kudos yet
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <template v-if="isOwner">
            When someone super upvotes your content, their thank-you note will appear here.
          </template>
          <template v-else>
            This user hasn't received any public kudos yet.
          </template>
        </p>
      </div>

      <!-- Pending entries section (owner only) -->
      <div v-if="hasPendingEntries" class="mb-8">
        <h2
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
        >
          <i class="fa-solid fa-clock text-yellow-500" />
          Pending Entries
          <span
            class="rounded-full bg-yellow-100 px-2 py-0.5 text-sm font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
          >
            {{ pendingEntries.length }}
          </span>
        </h2>
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          These entries are only visible to you. Make them public to show on your profile.
        </p>
        <div class="space-y-4">
          <ScratchpadEntry
            v-for="entry in pendingEntries"
            :key="entry.id"
            :entry="entry"
            :is-owner="true"
            @updated="handleEntryUpdated"
            @deleted="handleEntryDeleted"
          />
        </div>
      </div>

      <!-- Public entries section -->
      <div v-if="hasPublicEntries">
        <h2
          v-if="hasPendingEntries"
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
        >
          <i class="fa-solid fa-globe text-green-500" />
          Public Entries
          <span
            class="rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800 dark:bg-green-800 dark:text-green-100"
          >
            {{ publicEntries.length }}
          </span>
        </h2>
        <div class="space-y-4">
          <ScratchpadEntry
            v-for="entry in publicEntries"
            :key="entry.id"
            :entry="entry"
            :is-owner="isOwner"
            @updated="handleEntryUpdated"
            @deleted="handleEntryDeleted"
          />
        </div>
        <LoadMore
          v-if="showLoadMore"
          class="mt-4"
          :loading="publicLoading"
          :reached-end-of-results="!showLoadMore"
          @load-more="loadMorePublicEntries"
        />
      </div>
    </template>
  </div>
</template>
