<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GET_CHANNEL_NAMES,
  GET_USER_FAVORITE_CHANNELS,
} from '@/graphQLData/channel/queries';
import { GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS } from '@/graphQLData/collection/queries';
import MultiSelect from '@/components/MultiSelect.vue';
import type {
  MultiSelectOption,
  MultiSelectSection,
} from '@/components/MultiSelect.vue';
import type { Channel, ChannelWhere, Collection } from '@/__generated__/graphql';
import { useUsername, useIsAuthenticated } from '@/composables/useAuthState';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';

const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();

type ChannelFlag = 'eventsEnabled' | 'downloadsEnabled';
type ChannelOptionSource = Pick<
  Channel,
  'uniqueName' | 'displayName' | 'channelIconURL'
> &
  Partial<Record<ChannelFlag, boolean | null>>;

const UNAVAILABLE_REASON_BY_FLAG: Record<ChannelFlag, string> = {
  eventsEnabled: 'Does not allow events',
  downloadsEnabled: 'Does not allow downloads',
};

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
  channelWhere: {
    type: Object as PropType<ChannelWhere>,
    default: null,
  },
  requiredEnabledChannelFlags: {
    type: Array as PropType<ChannelFlag[]>,
    default: () => [],
  },
  lockedChannelName: {
    type: String,
    default: '',
  },
  lockedChannelLabel: {
    type: String,
    default: '',
  },
  lockedDescription: {
    type: String,
    default: '',
  },
});

// Emits definition
const emit = defineEmits(['setSelectedChannels']);

const searchQuery = ref('');
const isSearchActive = computed(() => searchQuery.value.trim().length > 0);
const isLocked = computed(() => !!props.lockedChannelName);

const { loading: channelsLoading, result: channelsResult } = useQuery(
  GET_CHANNEL_NAMES,
  computed(() => ({
    channelWhere: props.channelWhere
      ? {
          AND: [
            props.channelWhere,
            {
              uniqueName_MATCHES:
                createCaseInsensitivePattern(searchQuery.value) || '.*',
            },
          ],
        }
      : {
          uniqueName_MATCHES:
            createCaseInsensitivePattern(searchQuery.value) || '.*',
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

const channelHasRequiredFlags = (channel: ChannelOptionSource) => {
  return props.requiredEnabledChannelFlags.every(
    (flag) => channel[flag] !== false
  );
};

const getDisabledReasons = (channel: ChannelOptionSource) => {
  return props.requiredEnabledChannelFlags
    .filter((flag) => channel[flag] === false)
    .map((flag) => UNAVAILABLE_REASON_BY_FLAG[flag]);
};

const toSelectableOption = (channel: ChannelOptionSource): MultiSelectOption | null => {
  const reasons = getDisabledReasons(channel);

  if (reasons.length > 0 && !isSearchActive.value) {
    return null;
  }

  return {
    value: channel.uniqueName,
    label: channel.displayName || channel.uniqueName,
    avatar: channel.channelIconURL || '',
    disabled: reasons.length > 0,
    description: reasons[0],
  };
};

const channelOptions = computed<MultiSelectOption[]>(() => {
  const channels: ChannelOptionSource[] = channelsResult.value?.channels || [];
  const mappedChannels = channels
    .map((channel: ChannelOptionSource) => toSelectableOption(channel))
    .filter((channel): channel is MultiSelectOption => Boolean(channel));

  // Always include selected channels in options, even if they don't match current search
  // This ensures selected chips can always be displayed
  const existingChannelValues = new Set(
    mappedChannels.map((ch: MultiSelectOption) => ch.value)
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
  const favoriteChannels: ChannelOptionSource[] =
    favoritesResult.value?.users?.[0]?.FavoriteChannels || [];

  let favoritesEmptyMessage = 'You have no favorite forums.';
  if (!isAuthenticatedVar.value) {
    favoritesEmptyMessage =
      "Can't show favorite forums because you are not logged in.";
  }

  const favoriteOptions = favoriteChannels
    .map((channel: ChannelOptionSource) => toSelectableOption(channel))
    .filter((channel): channel is MultiSelectOption => Boolean(channel));

  sections.push({
    title: 'Favorite Forums',
    options: favoriteOptions,
    emptyMessage: favoritesEmptyMessage,
    selectAllLabel:
      favoriteOptions.some((option: MultiSelectOption) => !option.disabled)
        ? 'Select all favorite forums'
        : undefined,
  });

  // Channel collections - consolidated under single heading
  const collections = collectionsResult.value?.users?.[0]?.Collections || [];
  const collectionsWithChannels = collections.filter(
    (collection: Pick<Collection, 'Channels'>) => collection.Channels && collection.Channels.length > 0
  );

  if (collectionsWithChannels.length > 0) {
    // Create options for each collection (for select all functionality)
    const collectionOptions = collectionsWithChannels
      .map((collection: Pick<Collection, 'id' | 'name' | 'Channels'>) => ({
        value: collection.id,
        label: collection.name,
        // Store the channel uniqueNames for select all functionality
        channels: (collection.Channels || [])
          .filter((channel: ChannelOptionSource) =>
            channelHasRequiredFlags(channel)
          )
          .map((ch: Pick<Channel, 'uniqueName'>) => ch.uniqueName),
      }))
      .filter((collection: { channels: string[] }) => {
        return collection.channels.length > 0;
      });

    if (collectionOptions.length > 0) {
      sections.push({
        title: 'Forum Lists From Your Collections',
        options: collectionOptions,
        isCollectionSection: true, // Custom flag to render differently
      } as MultiSelectSection & { isCollectionSection?: boolean });
    }
  }

  // All Forums section
  sections.push({
    title: 'Forums (Top 10)',
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
  <div v-if="isLocked">
    <div v-if="props.description" class="py-1 text-sm dark:text-gray-300">
      {{ props.description }}
    </div>
    <div
      :data-testid="props.testId"
      class="flex min-h-12 w-full items-center rounded-lg border px-4 py-2 text-left dark:border-gray-700 dark:bg-gray-700"
    >
      <span class="font-mono text-gray-900 dark:text-white">
        {{ props.lockedChannelName }}
      </span>
      <span
        v-if="
          props.lockedChannelLabel &&
          props.lockedChannelLabel !== props.lockedChannelName
        "
        class="ml-1 text-gray-500 dark:text-gray-400"
      >
        ({{ props.lockedChannelLabel }})
      </span>
    </div>
    <div
      v-if="props.lockedDescription"
      class="py-1 text-sm text-gray-600 dark:text-gray-400"
    >
      {{ props.lockedDescription }}
    </div>
  </div>
  <MultiSelect
    v-else
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
