<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PropType, Ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import SearchBar from '@/components/SearchBar.vue';
import ErrorBanner from './ErrorBanner.vue';
import { config } from '@/config';

const props = defineProps({
  selectedFileTypes: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits(['toggleSelection']);

const searchInput: Ref<string> = ref('');

const searchInputComputed = computed(() => searchInput.value);

const {
  loading: serverConfigLoading,
  error: serverConfigError,
  result: serverConfigResult,
} = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const availableFileTypes = computed(() => {
  if (!serverConfigResult.value?.serverConfigs?.[0]?.allowedFileTypes) {
    return [];
  }

  const fileTypes = serverConfigResult.value.serverConfigs[0].allowedFileTypes;

  // Filter by search input if provided
  if (searchInputComputed.value.trim()) {
    return fileTypes.filter((fileType: string) =>
      fileType.toLowerCase().includes(searchInputComputed.value.toLowerCase())
    );
  }

  return fileTypes;
});

const selected = ref([...props.selectedFileTypes]);

watch(
  () => props.selectedFileTypes,
  (newVal) => {
    selected.value = [...newVal];
  }
);

function updateSearchResult(input: string) {
  searchInput.value = input;
}
</script>

<template>
  <div
    class="touch-scroll-y absolute left-0 right-0 top-full z-10 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
  >
    <SearchBar
      class="w-full align-middle"
      :test-id="'file-types-input'"
      :auto-focus="true"
      :search-placeholder="'Search file types'"
      :initial-value="searchInput"
      :right-side-is-rounded="false"
      :left-side-is-rounded="false"
      @update-search-input="updateSearchResult"
    />

    <div v-if="serverConfigLoading" class="p-4 text-center">Loading...</div>
    <div v-else-if="serverConfigError" class="p-2">
      <ErrorBanner
        class="text-sm text-red-500"
        :text="serverConfigError.message"
      />
    </div>
    <div
      v-else-if="availableFileTypes.length === 0"
      class="p-4 text-center text-gray-500 dark:text-gray-400"
    >
      <div v-if="searchInputComputed.trim()">
        No file types match your search
      </div>
      <div v-else>No file types are configured on the server</div>
    </div>
    <div
      v-for="fileType in availableFileTypes"
      :key="fileType"
      class="border-b p-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
    >
      <label class="flex cursor-pointer items-center space-x-3 p-2">
        <input
          type="checkbox"
          :value="fileType"
          :checked="selected.includes(fileType)"
          :aria-label="`Select file type ${fileType}`"
          class="border border-gray-300 text-orange-600 dark:border-gray-600"
          @change="() => emit('toggleSelection', fileType)"
        >
        <div class="flex items-center space-x-2">
          <div class="flex-col">
            <span
              :data-testid="`file-type-picker-${fileType}`"
              class="font-bold"
              >{{ fileType }}</span
            >
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<style>
.touch-scroll-y {
  -webkit-overflow-scrolling: touch;
}
</style>
