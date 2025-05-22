<script setup lang="ts">
  import { ref, computed, watch } from "vue";
  import type { PropType, Ref } from "vue";
  import { useQuery, useMutation } from "@vue/apollo-composable";
  import { GET_TAGS } from "@/graphQLData/tag/queries";
  import type { Tag } from "@/__generated__/graphql";
  import SearchBar from "@/components/SearchBar.vue";
  import { CREATE_TAG } from "@/graphQLData/tag/mutations";
  import ErrorBanner from "./ErrorBanner.vue";

  const {
    mutate: createTag,
    error: createTagError,
    loading: createTagLoading,
  } = useMutation(CREATE_TAG);

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

  const emit = defineEmits(["toggleSelection"]);

  const searchInput: Ref<string> = ref("");

  const searchInputComputed = computed(() => searchInput.value);

  const {
    loading: tagsLoading,
    error: tagsError,
    result: tagsResult,
  } = useQuery(
    GET_TAGS,
    {
      where: {
        text_CONTAINS: searchInputComputed,
      },
    },
    {
      fetchPolicy: "cache-first",
    }
  );

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

  const handleAddTag = async (event: KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      if (!selected.value.includes(value)) {
        try {
          const response = await createTag({ input: [{ text: value }] });
          const createdTag = response?.data?.createTags?.tags?.[0]?.text;
          if (createdTag) {
            selected.value.push(createdTag);
            emit("toggleSelection", createdTag);
          }
          input.value = "";
        } catch (error) {
          console.error("Error creating tag:", error);
        }
      }
    }
  };
</script>

<template>
  <div
    class="touch-scroll-y absolute left-0 right-0 top-full z-10 max-h-60 w-full overflow-y-auto rounded-md border border-gray-500 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
  >
    <SearchBar
      :auto-focus="true"
      class="w-full align-middle"
      :disabled="createTagLoading"
      :initial-value="searchInput"
      :left-side-is-rounded="false"
      :right-side-is-rounded="false"
      :search-placeholder="'Search tags'"
      :test-id="'tags-input'"
      @keydown.enter.prevent="handleAddTag"
      @update-search-input="updateSearchResult"
    />
    <ErrorBanner
      v-if="createTagError"
      class="mt-1 text-sm text-red-500"
      :text="createTagError.message"
    />
    <div v-if="tagsLoading">Loading...</div>
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
          :checked="selected.includes(tag.text)"
          class="text-orange-600 border border-gray-500 dark:border-gray-600"
          type="checkbox"
          :value="tag.text"
          @change="() => emit('toggleSelection', tag.text)"
        />
        <div class="flex items-center space-x-2">
          <div class="flex-col">
            <span
              class="font-bold"
              :data-testid="`tag-picker-${tag.text}`"
              >{{ tag.text }}</span
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
