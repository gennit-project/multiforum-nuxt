<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_TAGS } from "@/graphQLData/tag/queries";
import type { Tag } from "@/src/__generated__/graphql";
import SearchBar from "@/components/SearchBar.vue";

const props = defineProps({
  hideSelected: {
    type: Boolean,
    default: false,
  },
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(['toggleSelection']);

const searchInput: Ref<string> = ref("");

const searchInputComputed = computed(() => searchInput.value);

const { loading: tagsLoading, error: tagsError, result: tagsResult } = useQuery(GET_TAGS, {
  where: {
    text_CONTAINS: searchInputComputed,
  },
});

const tagOptions = computed(() => {
  if (!tagsResult.value || !tagsResult.value.tags) {
    return [];
  }
  return tagsResult.value.tags.map((tag: Tag) => ({
    text: tag.text,
  }));
});

const selected = ref([...props.selectedTags]);

watch(
  () => props.selectedTags,
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
    class="absolute z-10 mt-1 max-h-96 w-full overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white shadow-lg dark:bg-gray-800"
  >
    <SearchBar
      class="w-full align-middle"
      :auto-focus="true"
      :search-placeholder="'Search tags'"
      :initial-value="searchInput"
      :right-side-is-rounded="false"
      :left-side-is-rounded="false"
      @keydown.enter.prevent
      @update-search-input="updateSearchResult"
    />
    <div v-if="tagsLoading">
      Loading...
    </div>
    <div v-else-if="tagsError">
      <div
        v-for="(error, i) of tagsError?.graphQLErrors"
        :key="i"
      >
        {{ error.message }}
      </div>
    </div>
    <div
      v-for="tag in tagOptions"
      :key="tag.text"
      class="border-b p-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
    >
      <label class="flex cursor-pointer items-center space-x-3 p-2">
        <input
          type="checkbox"
          :value="tag.text"
          :checked="selected.includes(tag.text)"
          class="form-checkbox"
          @change="() => emit('toggleSelection', tag.text)"
        >
        <div class="flex items-center space-x-2">
          <div class="flex-col">
            <span class="font-bold">{{ tag.text }}</span>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>
