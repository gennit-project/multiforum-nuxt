<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_TAGS } from '@/graphQLData/tag/queries';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import type { Tag, TagWhere } from '@/__generated__/graphql';

const props = defineProps({
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  setSelectedTags: [tags: string[]];
}>();

const searchQuery = ref('');

const { loading: tagsLoading, result: tagsResult } = useQuery<
  { tags: Pick<Tag, 'text'>[] },
  { where: TagWhere }
>(
  GET_TAGS,
  computed(() => ({
    where: {
      text_CONTAINS: searchQuery.value,
    },
  })),
  {
    fetchPolicy: 'cache-first',
  }
);

const searchResultTags = computed(
  () => tagsResult.value?.tags.map((tag) => tag.text) || []
);

// New tags don't need to be created here: every form that saves tags
// uses connectOrCreate, so a tag that doesn't exist yet is created on save.
const tagOptions = computed<MultiSelectOption[]>(() => {
  // Selected tags stay in the options even when they don't match the
  // current search, so MultiSelect can always render the full selection.
  const knownTags = [
    ...new Set([...props.selectedTags, ...searchResultTags.value]),
  ];
  const options: MultiSelectOption[] = knownTags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const query = searchQuery.value.trim();
  const queryIsKnown = knownTags.some(
    (tag) => tag.toLowerCase() === query.toLowerCase()
  );
  if (query && !queryIsKnown) {
    options.unshift({
      value: query,
      label: `Create "${query}"`,
      icon: 'fa-solid fa-plus',
    });
  }

  return options;
});

const handleUpdateTags = (newTags: string[]) => {
  emit('setSelectedTags', [...newTags]);
};

// Typed entries reuse the casing of a matching known tag, and are skipped
// if they're already selected.
const handleSubmitText = (entries: string[]) => {
  const nextTags = [...props.selectedTags];
  for (const entry of entries) {
    const tag =
      [...nextTags, ...searchResultTags.value].find(
        (known) => known.toLowerCase() === entry.toLowerCase()
      ) || entry;
    if (!nextTags.includes(tag)) {
      nextTags.push(tag);
    }
  }
  if (nextTags.length !== props.selectedTags.length) {
    emit('setSelectedTags', nextTags);
  }
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
    :loading="tagsLoading"
    placeholder="Select tags..."
    search-placeholder="Type to search or add tags, separated by commas..."
    test-id="tag-picker"
    searchable
    allow-text-entry
    @update:model-value="handleUpdateTags"
    @search="handleSearch"
    @submit-text="handleSubmitText"
  />
</template>
