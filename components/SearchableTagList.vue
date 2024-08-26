<script lang="ts">
import { defineComponent, PropType, computed, ref, Ref } from "vue";
import { GET_TAGS } from "@/graphQLData/tag/queries";
import { useQuery } from "@vue/apollo-composable";
import { Tag } from "@/src/__generated__/graphql";
import SearchBar from "@/components/SearchBar.vue";

export default defineComponent({
  components: {
    SearchBar,
  },
  props: {
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
  },
  setup(props) {
    const searchInput: Ref<string> = ref("");

    const searchInputComputed = computed(() => {
      return searchInput.value;
    });

    const {
      loading: tagsLoading,
      error: tagsError,
      result: tagsResult,
    } = useQuery(GET_TAGS, {
      where: {
        text_CONTAINS: searchInputComputed,
      },
    });

    const isDropdownOpen = ref(false);

    const tagOptions = computed(() => {
      if (!tagsResult.value || !tagsResult.value.tags) {
        return [];
      }
      return tagsResult.value.tags.map((tag: Tag) => ({
        text: tag.text,
      }));
    });

    const selected = ref([...props.selectedTags]);

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };
    return {
      tagsError,
      tagsLoading,
      tagOptions,
      isDropdownOpen,
      toggleDropdown,
      searchInput,
      selected,
    };
  },
  watch: {
    selectedTags(newVal) {
      this.selected = [...newVal];
    },
  },
  methods: {
    updateSearchResult(input: string) {
      this.searchInput = input;
    },
    outside() {
      this.isDropdownOpen = false;
    },
  },
});
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
      @updateSearchInput="updateSearchResult"
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
          @change="() => {
            $emit('toggleSelection',tag.text)
          }"
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
