<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL_NAMES, GET_USER_FAVORITE_CHANNELS } from '@/graphQLData/channel/queries';
import { GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS } from '@/graphQLData/collection/queries';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption, MultiSelectSection } from '@/components/MultiSelect.vue';
import type { Channel } from '@/__generated__/graphql';
import { usernameVar, isAuthenticatedVar } from '@/cache';

// Props definition - used in template
const props = defineProps({
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

const searchQuery = ref('');

const { loading: channelsLoading, result: channelsResult } = useQuery(
  GET_CHANNEL_NAMES,
  computed(() => ({
    channelWhere: {
      uniqueName_MATCHES: searchQuery.value
        ? `(?i).*${searchQuery.value}.*`
        : '.*',
    },
  })),
  {
    fetchPolicy: 'cache-first',
  }
);

// Query for favorite channels (only when user is authenticated)
const { result: favoritesResult } = useQuery(
  GET_USER_FAVORITE_CHANNELS,
  computed(() => ({
    username: usernameVar.value,
  })),
  {
    enabled: computed(() => !!usernameVar.value),
    fetchPolicy: 'cache-first',
  }
);

// Query for channel collections (only when user is authenticated)
const { result: collectionsResult } = useQuery(
  GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS,
  computed(() => ({
    username: usernameVar.value,
  })),
  {
    enabled: computed(() => !!usernameVar.value),
    fetchPolicy: 'cache-first',
  }
);

const channelOptions = computed<MultiSelectOption[]>(() => {
  const channels = channelsResult.value?.channels || [];
  const mappedChannels = channels.map((channel: Channel) => ({
    value: channel.uniqueName,
    label: channel.displayName || channel.uniqueName,
    avatar: channel.channelIconURL || '',
  }));

  // Always include selected channels in options, even if they don't match current search
  // This ensures selected chips can always be displayed
  const existingChannelValues = new Set(
    mappedChannels.map((ch: any) => ch.value)
  );

  // Add any selected channels that aren't in the current search results
  (props.selectedChannels || []).forEach((selectedValue) => {
    if (!existingChannelValues.has(selectedValue)) {
      // Create a basic option for the selected channel that's not in current results
      mappedChannels.push({
        value: selectedValue,
        label: selectedValue, // Use uniqueName as label since we don't have the full data
        avatar: '',
      });
    }
  });

  return mappedChannels;
});

// Create sections with favorites, collections, and all channels
const channelSections = computed<MultiSelectSection[]>(() => {
  const sections: MultiSelectSection[] = [];

  // Favorites section
  const favoriteChannels = favoritesResult.value?.users?.[0]?.FavoriteChannels || [];

  let favoritesEmptyMessage = 'You have no favorite forums.';
  if (!isAuthenticatedVar.value) {
    favoritesEmptyMessage = "Can't show favorite forums because you are not logged in.";
  }

  const favoriteOptions = favoriteChannels.map((channel: any) => ({
    value: channel.uniqueName,
    label: channel.displayName || channel.uniqueName,
    avatar: channel.channelIconURL || '',
  }));

  sections.push({
    title: 'Favorite Forums',
    options: favoriteOptions,
    emptyMessage: favoritesEmptyMessage,
    selectAllLabel: favoriteOptions.length > 0 ? 'Select all favorite forums' : undefined,
  });

  // Channel collections sections
  const collections = collectionsResult.value?.users?.[0]?.Collections || [];
  collections.forEach((collection: any) => {
    const collectionChannels = (collection.Channels || []).map((channel: any) => ({
      value: channel.uniqueName,
      label: channel.displayName || channel.uniqueName,
      avatar: channel.channelIconURL || '',
    }));

    if (collectionChannels.length > 0) {
      sections.push({
        title: collection.name,
        options: collectionChannels,
        selectAllLabel: `Select all from ${collection.name}`,
      });
    }
  });

  // All Forums section
  sections.push({
    title: 'All Forums',
    options: channelOptions.value,
  });

  return sections;
});

const handleUpdateChannels = (newChannels: string[]) => {
  emit('setSelectedChannels', newChannels);
};

const handleSearch = (query: string) => {
  // Store search query for GraphQL filtering
  searchQuery.value = query;
  // Do NOT emit any events that could affect selection
};
</script>

<template>
  <MultiSelect
    :model-value="props.selectedChannels"
    :sections="channelSections"
    :description="props.description"
    :loading="channelsLoading"
    :test-id="props.testId"
    placeholder="Select forums..."
    search-placeholder="Type to search..."
    searchable
    :show-chips="true"
    height="h-12"
    @update:model-value="handleUpdateChannels"
    @search="handleSearch"
  />
</template>
