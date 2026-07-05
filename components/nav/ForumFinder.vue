<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL_NAMES } from '@/graphQLData/channel/queries';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';
import SearchBar from '@/components/SearchBar.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import type { Channel } from '@/__generated__/graphql';

type ForumOption = Pick<
  Channel,
  'uniqueName' | 'displayName' | 'channelIconURL'
>;

const emit = defineEmits<{
  select: [uniqueName: string];
}>();

const searchInput = ref('');

// Reuses the same forum-search query and case-insensitive pattern helper as
// ForumPicker/SearchableForumList. An empty search falls back to `.*` so the
// list shows the top forums as soon as the picker opens.
const { result, loading, error } = useQuery(
  GET_CHANNEL_NAMES,
  computed(() => ({
    channelWhere: {
      uniqueName_MATCHES:
        createCaseInsensitivePattern(searchInput.value) || '.*',
    },
  })),
  { fetchPolicy: 'cache-first' }
);

const forums = computed<ForumOption[]>(() => result.value?.channels || []);

const updateSearch = (value: string) => {
  searchInput.value = value;
};
</script>

<template>
  <div data-testid="forum-finder">
    <SearchBar
      class="w-full align-middle"
      :auto-focus="true"
      search-placeholder="Search forums"
      :initial-value="searchInput"
      test-id="forum-finder-search"
      @update-search-input="updateSearch"
      @keydown.enter.prevent
    />

    <div
      v-if="loading && forums.length === 0"
      class="px-2 py-3 text-sm text-gray-500 dark:text-gray-400"
    >
      Loading...
    </div>
    <div
      v-else-if="error"
      class="px-2 py-3 text-sm text-red-600 dark:text-red-400"
    >
      {{ error.message }}
    </div>
    <ul v-else role="list" class="m-0 mt-2 p-0">
      <li
        v-if="forums.length === 0"
        class="px-2 py-3 text-sm text-gray-500 dark:text-gray-400"
      >
        No forums found
      </li>
      <li
        v-for="forum in forums"
        :key="forum.uniqueName"
        class="m-0 list-none"
      >
        <button
          type="button"
          :data-testid="`forum-finder-result-${forum.uniqueName}`"
          class="font-semibold group flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          @click="emit('select', forum.uniqueName)"
        >
          <AvatarComponent
            class="border-1 h-8 w-8 shrink-0 border-gray-200 shadow-sm dark:border-gray-800"
            :text="forum.uniqueName || ''"
            :src="forum.channelIconURL ?? ''"
            :is-small="true"
            :is-square="false"
            :is-decorative="true"
          />
          <span class="truncate">{{
            forum.displayName || forum.uniqueName
          }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
