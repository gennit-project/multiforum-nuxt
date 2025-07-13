<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_TAGS } from "@/graphQLData/tag/queries";
import { CREATE_TAG } from "@/graphQLData/tag/mutations";
import MultiSelect from "@/components/MultiSelect.vue";
import type { MultiSelectOption } from "@/components/MultiSelect.vue";
import type { Tag } from "@/__generated__/graphql";

const props = defineProps({
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["setSelectedTags"]);

const searchQuery = ref("");

const {
  mutate: createTag,
  loading: createTagLoading,
} = useMutation(CREATE_TAG);

const {
  loading: tagsLoading,
  result: tagsResult,
  refetch: refetchTags,
} = useQuery(
  GET_TAGS,
  computed(() => ({
    where: {
      text_CONTAINS: searchQuery.value,
    },
  })),
  {
    fetchPolicy: "cache-first",
  }
);

const tagOptions = computed<MultiSelectOption[]>(() => {
  const tags = tagsResult.value?.tags || [];
  const options = tags.map((tag: Tag) => ({
    value: tag.text,
    label: tag.text,
  }));
  
  // Add option to create new tag if search doesn't match existing tags
  if (searchQuery.value && !tags.some((tag: Tag) => tag.text.toLowerCase() === searchQuery.value.toLowerCase())) {
    options.unshift({
      value: searchQuery.value,
      label: `Create "${searchQuery.value}"`,
      icon: "fa-solid fa-plus",
    });
  }
  
  return options;
});

const handleUpdateTags = async (newTags: string[]) => {
  // Check if we need to create any new tags
  const existingTags = tagsResult.value?.tags?.map((tag: Tag) => tag.text) || [];
  const tagsToCreate = newTags.filter(tag => !existingTags.includes(tag));
  
  // Create new tags
  for (const tagText of tagsToCreate) {
    try {
      await createTag({ input: [{ text: tagText }] });
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  }
  
  // Refetch tags to update the list
  if (tagsToCreate.length > 0) {
    await refetchTags();
  }
  
  emit("setSelectedTags", newTags);
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
};
</script>

<template>
  <MultiSelect
    :model-value="selectedTags"
    :options="tagOptions"
    :description="description"
    :loading="tagsLoading || createTagLoading"
    placeholder="There are no tags yet"
    search-placeholder="Add a tag..."
    test-id="tag-picker"
    searchable
    show-chips
    @update:model-value="handleUpdateTags"
    @search="handleSearch"
  />
</template>