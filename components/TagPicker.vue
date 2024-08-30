<script lang="ts">
import type { PropType, Ref } from "vue";
import { defineComponent, computed, ref } from "vue";
import { GET_TAGS } from "@/graphQLData/tag/queries";
import { useQuery } from "@vue/apollo-composable";
import type { Tag } from "@/src/__generated__/graphql";
import clickOutside from "vue-click-outside";
import SearchableTagList from '@/components/forms/SearchableTagList.vue'

export default defineComponent({
  components: {
    SearchableTagList,
  },
  directives: {
    clickOutside,
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
  setup(props, ) {
    const emit = defineEmits([
      "setSelectedTags",
    ]);
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

    const toggleSelectedTag = (tag: string) => {
      const index = selected.value.indexOf(tag);
      if (index === -1) {
        selected.value.push(tag);
      } else {
        selected.value.splice(index, 1);
      }
      emit("setSelectedTags", selected.value);
    };

    return {
      tagsError,
      tagsLoading,
      tagOptions,
      isDropdownOpen,
      toggleDropdown,
      searchInput,
      selected,
      toggleSelectedTag,
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
    removeSelection(tag: string) {
      this.selected = this.selected.filter((c: string) => c !== tag);
      this.$emit("setSelectedTags", this.selected);
    },
  },
});
</script>

<template>
  <div>
    <div>
      <div
        v-if="description"
        class="py-1 text-sm dark:text-gray-300"
      >
        {{ description }}
      </div>
      <div class="relative">
        <div
          class="flex min-h-12 w-full cursor-pointer flex-wrap items-center rounded-lg border px-4 py-2 text-left dark:border-gray-700 dark:bg-gray-700"
          @click="toggleDropdown"
        >
          <div
            v-for="(tag, index) in selected"
            :key="index"
            class="mr-2 mt-1 flex items-center rounded-full bg-blue-100 px-2 text-blue-700 dark:bg-blue-700 dark:text-blue-100"
            @click="removeSelection(tag)"
          >
            <span>{{ tag }}</span>
            <span
              class="ml-1 cursor-pointer"
              @click.stop="removeSelection(tag)"
            >
              &times;
            </span>
          </div>
        </div>
        <SearchableTagList
          v-if="isDropdownOpen"
          v-click-outside="outside"
          :selected-tags="selected"
          @toggle-selection="toggleSelectedTag"
        />
      </div>
    </div>
  </div>
</template>
