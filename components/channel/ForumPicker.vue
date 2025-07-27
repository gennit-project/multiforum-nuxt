<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL_NAMES } from '@/graphQLData/channel/queries';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import type { Channel } from '@/__generated__/graphql';

// Props definition - used in template
defineProps({
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
});

// Emits definition
const emit = defineEmits(['setSelectedChannels']);

const searchQuery = ref("");

const {
  loading: channelsLoading,
  result: channelsResult,
} = useQuery(
  GET_CHANNEL_NAMES,
  computed(() => ({
    channelWhere: {
      uniqueName_MATCHES: searchQuery.value ? `(?i).*${searchQuery.value}.*` : ".*",
    },
  })),
  {
    fetchPolicy: "cache-first",
  }
);

const channelOptions = computed<MultiSelectOption[]>(() => {
  const channels = channelsResult.value?.channels || [];
  return channels.map((channel: Channel) => ({
    value: channel.uniqueName,
    label: channel.displayName || channel.uniqueName,
    avatar: channel.channelIconURL || '',
  }));
});

const handleUpdateChannels = (newChannels: string[]) => {
  emit('setSelectedChannels', newChannels);
};

const handleSearch = (query: string) => {
  searchQuery.value = query;
};
</script>

<template>
  <MultiSelect
    :model-value="selectedChannels"
    :options="channelOptions"
    :description="description"
    :loading="channelsLoading"
    :test-id="testId"
    placeholder="Select forums..."
    search-placeholder="Type to search..."
    searchable
    :show-chips="false"
    height="h-12"
    @update:model-value="handleUpdateChannels"
    @search="handleSearch"
  />
</template>
