<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import type { Channel } from '@/__generated__/graphql';
import {
  GET_CHANNEL_NAMES,
  GET_USER_FAVORITE_CHANNELS,
} from '@/graphQLData/channel/queries';
import { GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS } from '@/graphQLData/collection/queries';
import SearchBar from '@/components/SearchBar.vue';
import type { PropType } from 'vue';
import SearchableForumListItem from './SearchableForumListItem.vue';
import { usernameVar, isAuthenticatedVar } from '@/cache';

// Define props
const props = defineProps({
  hideSelected: {
    type: Boolean,
    default: false,
  },
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: 'Select forums to submit to',
  },
  featuredForums: {
    type: Array as PropType<ChannelOption[]>,
    default: () => [],
  },
});

type ChannelOption = {
  uniqueName: string;
  displayName: string;
  icon: string;
  description: string;
};

// Type for raw channel data from GraphQL
type RawChannelData = {
  uniqueName: string;
  displayName?: string | null;
  channelIconURL?: string | null;
};

// Type for raw collection data from GraphQL
type RawCollectionData = {
  id: string;
  name: string;
  Channels?: RawChannelData[];
};

// Simplified channel type for collections (doesn't have description)
type CollectionChannelOption = {
  uniqueName: string;
  displayName: string;
  icon: string;
};

// Type for processed collection with channels
type ProcessedCollection = {
  id: string;
  name: string;
  channels: CollectionChannelOption[];
  allChannels: CollectionChannelOption[];
};

const emit = defineEmits(['setChannelNames', 'toggleSelection']);
const searchInput = ref<string>('');
const selected = ref([...props.selectedChannels]);
const searchInputComputed = computed(() => `(?i).*${searchInput.value}.*`);
const showAllFavorites = ref(false);

const {
  loading: channelsLoading,
  error: channelsError,
  result: channelsResult,
  onResult: onGetChannelNames,
} = useQuery(GET_CHANNEL_NAMES, {
  channelWhere: {
    uniqueName_MATCHES: searchInputComputed,
  },
});

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

// Track which collections are expanded (show all channels)
const expandedCollections = ref<Set<string>>(new Set());

// Get channel collections with their channels
const channelCollections = computed(() => {
  const collections = collectionsResult.value?.users?.[0]?.Collections || [];

  return collections
    .map((collection: RawCollectionData) => {
      const channels = (collection.Channels || []).map((channel: RawChannelData) => ({
        uniqueName: channel.uniqueName,
        displayName: channel.displayName || channel.uniqueName,
        icon: channel.channelIconURL || '',
      }));

      // Filter by search if there's a search query
      const filteredChannels = searchInput.value
        ? channels.filter(
            (channel: CollectionChannelOption) =>
              channel.uniqueName
                .toLowerCase()
                .includes(searchInput.value.toLowerCase()) ||
              channel.displayName
                .toLowerCase()
                .includes(searchInput.value.toLowerCase())
          )
        : channels;

      return {
        id: collection.id,
        name: collection.name,
        channels: filteredChannels,
        allChannels: channels, // Keep all channels for selection logic
      };
    })
    .filter(
      (collection: ProcessedCollection) => collection.channels.length > 0 || !searchInput.value
    );
});

const toggleCollectionExpansion = (collectionId: string) => {
  if (expandedCollections.value.has(collectionId)) {
    expandedCollections.value.delete(collectionId);
  } else {
    expandedCollections.value.add(collectionId);
  }
  // Force reactivity update
  expandedCollections.value = new Set(expandedCollections.value);
};

const toggleSelectAllCollection = (collection: {
  id: string;
  allChannels: ChannelOption[];
}) => {
  const collectionValues = collection.allChannels.map(
    (ch: ChannelOption) => ch.uniqueName
  );
  const currentSelected = props.selectedChannels || [];

  const shouldDeselect = collectionValues.every((val: string) =>
    currentSelected.includes(val)
  );

  if (shouldDeselect) {
    collectionValues.forEach((uniqueName: string) => {
      if (currentSelected.includes(uniqueName)) {
        emit('toggleSelection', uniqueName);
      }
    });
  } else {
    collectionValues.forEach((uniqueName: string) => {
      if (!currentSelected.includes(uniqueName)) {
        emit('toggleSelection', uniqueName);
      }
    });
  }
};

const isCollectionFullySelected = (collection: {
  allChannels: ChannelOption[];
}) => {
  const collectionValues = collection.allChannels.map(
    (ch: ChannelOption) => ch.uniqueName
  );
  const currentSelected = props.selectedChannels || [];
  return (
    collectionValues.length > 0 &&
    collectionValues.every((val: string) => currentSelected.includes(val))
  );
};

// Get favorite channels
const favoriteChannels = computed(() => {
  const favorites = favoritesResult.value?.users?.[0]?.FavoriteChannels || [];

  // Map to ChannelOption format
  const mappedFavorites = favorites.map((channel: RawChannelData) => ({
    uniqueName: channel.uniqueName,
    displayName: channel.displayName || channel.uniqueName,
    icon: channel.channelIconURL || '',
    description: '',
  }));

  // Filter by search if there's a search query
  if (searchInput.value) {
    return mappedFavorites.filter(
      (channel: ChannelOption) =>
        channel.uniqueName
          .toLowerCase()
          .includes(searchInput.value.toLowerCase()) ||
        channel.displayName
          .toLowerCase()
          .includes(searchInput.value.toLowerCase())
    );
  }

  return mappedFavorites;
});

// Separate featured and regular channels
const featuredChannels = computed(() => {
  return props.featuredForums
    .filter((channelOption: ChannelOption) => {
      return props.featuredForums.some(
        (featuredChannel) =>
          featuredChannel.uniqueName === channelOption.uniqueName
      );
    })
    .sort(
      (a, b) =>
        props.featuredForums.findIndex(
          (channel) => channel.uniqueName === a.uniqueName
        ) -
        props.featuredForums.findIndex(
          (channel) => channel.uniqueName === b.uniqueName
        )
    );
});

const regularChannels = computed(() => {
  return channelsResult.value?.channels
    .filter((channel: Channel) => {
      return !props.featuredForums.some(
        (featuredChannel) => featuredChannel.uniqueName === channel.uniqueName
      );
    })
    .sort((a: ChannelOption, b: ChannelOption) => {
      return a.uniqueName.localeCompare(b.uniqueName);
    });
});

// Watch the query result
onGetChannelNames(() => {
  const channels = channelsResult.value?.channels.map((channel: Channel) => ({
    uniqueName: channel.uniqueName,
    displayName: channel.displayName,
    icon: channel.channelIconURL,
    description: channel.description,
  }));
  emit('setChannelNames', channels);
});

watch(
  () => props.selectedChannels,
  (newVal) => {
    selected.value = [...newVal];
  }
);

const updateSearchResult = (input: string) => {
  searchInput.value = input;
};

const toggleSelectAllFavorites = () => {
  const favoriteValues = favoriteChannels.value.map(
    (ch: ChannelOption) => ch.uniqueName
  );
  // Use props.selectedChannels directly to avoid stale state issues
  const currentSelected = props.selectedChannels || [];

  // Check if we're currently in "all selected" state
  // We need to check this BEFORE any toggles happen
  const shouldDeselect = favoriteValues.every((val: string) =>
    currentSelected.includes(val)
  );

  if (shouldDeselect) {
    // Deselect all favorites (only toggle ones that are currently selected)
    favoriteValues.forEach((uniqueName: string) => {
      if (currentSelected.includes(uniqueName)) {
        emit('toggleSelection', uniqueName);
      }
    });
  } else {
    // Select all favorites that aren't already selected
    favoriteValues.forEach((uniqueName: string) => {
      if (!currentSelected.includes(uniqueName)) {
        emit('toggleSelection', uniqueName);
      }
    });
  }
};

const areAllFavoritesSelected = computed(() => {
  const favoriteValues = favoriteChannels.value.map(
    (ch: ChannelOption) => ch.uniqueName
  );
  const currentSelected = props.selectedChannels || [];
  return (
    favoriteValues.length > 0 &&
    favoriteValues.every((val: string) => currentSelected.includes(val))
  );
});
</script>

<template>
  <div
    class="touch-scroll-y absolute left-0 right-0 top-full z-50 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
  >
    <SearchBar
      class="w-full align-middle"
      :auto-focus="true"
      :search-placeholder="'Search forums'"
      :initial-value="searchInput"
      :right-side-is-rounded="false"
      :left-side-is-rounded="false"
      @keydown.enter.prevent
      @update-search-input="updateSearchResult"
    />
    <div v-if="channelsLoading && regularChannels?.length === 0">
      Loading...
    </div>
    <div v-else-if="channelsError">
      <div v-for="(error, i) of channelsError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <template v-else>
      <!-- Favorite Forums Section -->
      <div
        v-if="isAuthenticatedVar || favoriteChannels.length > 0"
        class="border-b dark:border-gray-600"
      >
        <p
          class="px-3 pt-3 text-sm font-semibold uppercase text-gray-700 dark:text-gray-300"
        >
          Favorite Forums
        </p>
        <div
          v-if="!isAuthenticatedVar"
          class="px-3 py-3 text-sm text-gray-500 dark:text-gray-400"
        >
          Can't show favorite forums because you are not logged in.
        </div>
        <div
          v-else-if="favoriteChannels.length === 0"
          class="px-3 py-3 text-sm text-gray-500 dark:text-gray-400"
        >
          You have no favorite forums.
        </div>
        <template v-else>
          <!-- Select All Favorites Option -->
          <div>
            <div
              :class="[
                'flex cursor-pointer items-center border-b px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700',
                areAllFavoritesSelected
                  ? 'bg-orange-50 dark:bg-orange-900/20'
                  : '',
              ]"
              @click="toggleSelectAllFavorites"
            >
              <!-- Checkbox for select all -->
              <div class="relative mr-3">
                <input
                  type="checkbox"
                  :checked="areAllFavoritesSelected"
                  aria-label="Select all favorite forums"
                  class="h-4 w-4 rounded border border-gray-400 text-orange-600 checked:border-orange-600 checked:bg-orange-600 checked:text-white focus:ring-orange-500 dark:border-gray-500 dark:bg-gray-700"
                  @click.stop="toggleSelectAllFavorites"
                >
              </div>

              <!-- Label -->
              <span
                class="flex-1 text-sm font-medium text-gray-900 dark:text-white"
              >
                Select all favorite forums
              </span>

              <!-- Count badge -->
              <span
                class="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300"
              >
                {{ favoriteChannels.length }}
              </span>
            </div>

            <!-- Preview list of forums -->
            <div class="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
              <span v-if="favoriteChannels.length <= 3">
                {{
                  favoriteChannels
                    .map((ch: ChannelOption) => ch.uniqueName)
                    .join(', ')
                }}
              </span>
              <span v-else-if="!showAllFavorites">
                {{
                  favoriteChannels
                    .slice(0, 3)
                    .map((ch: ChannelOption) => ch.uniqueName)
                    .join(', ')
                }}
                <button
                  class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                  @click.stop="showAllFavorites = true"
                >
                  (show all)
                </button>
              </span>
              <span v-else>
                {{
                  favoriteChannels
                    .map((ch: ChannelOption) => ch.uniqueName)
                    .join(', ')
                }}
                <button
                  class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                  @click.stop="showAllFavorites = false"
                >
                  (show less)
                </button>
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Channel Collections Section -->
      <div
        v-if="channelCollections.length > 0"
        class="border-b dark:border-gray-600"
      >
        <p
          class="px-3 pt-3 text-sm font-semibold uppercase text-gray-700 dark:text-gray-300"
        >
          Forum Lists From Your Collections
        </p>
        <div v-for="collection in channelCollections" :key="collection.id">
          <div
            v-if="collection.channels.length > 0"
            :class="[
              'flex cursor-pointer items-center border-b px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700',
              isCollectionFullySelected(collection)
                ? 'bg-orange-50 dark:bg-orange-900/20'
                : '',
            ]"
            @click="toggleSelectAllCollection(collection)"
          >
            <!-- Checkbox for select all -->
            <div class="relative mr-3">
              <input
                type="checkbox"
                :checked="isCollectionFullySelected(collection)"
                :aria-label="`Select all forums in ${collection.name}`"
                class="h-4 w-4 rounded border border-gray-400 text-orange-600 checked:border-orange-600 checked:bg-orange-600 checked:text-white focus:ring-orange-500 dark:border-gray-500 dark:bg-gray-700"
                @click.stop="toggleSelectAllCollection(collection)"
              >
            </div>

            <!-- Label and forum list inline -->
            <div class="flex-1 text-sm">
              <span class="font-medium text-gray-900 dark:text-white">{{
                collection.name
              }}</span>
              <span class="ml-1 text-gray-500 dark:text-gray-400">
                (<span v-if="collection.allChannels.length <= 3">{{
                  collection.allChannels
                    .map((ch: ChannelOption) => ch.uniqueName)
                    .join(', ')
                }}</span
                ><span v-else-if="!expandedCollections.has(collection.id)"
                  >{{
                    collection.allChannels
                      .slice(0, 3)
                      .map((ch: ChannelOption) => ch.uniqueName)
                      .join(', ')
                  }}<button
                    class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    @click.stop="toggleCollectionExpansion(collection.id)"
                  >
                    show more
                  </button></span
                ><span v-else
                  >{{
                    collection.allChannels
                      .map((ch: ChannelOption) => ch.uniqueName)
                      .join(', ')
                  }}<button
                    class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    @click.stop="toggleCollectionExpansion(collection.id)"
                  >
                    show less
                  </button></span
                >)
              </span>
            </div>

            <!-- Count badge -->
            <span
              class="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            >
              {{ collection.allChannels.length }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="featuredChannels.length > 0"
        class="border-b dark:border-gray-600"
      >
        <p
          class="px-3 pt-3 text-sm font-semibold uppercase text-gray-700 dark:text-gray-300"
        >
          Featured Forums
        </p>
        <div
          v-for="channel in featuredChannels"
          :key="channel.uniqueName"
          class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <SearchableForumListItem
            :channel="channel"
            :selected="selected"
            @toggle-selection="
              () => emit('toggleSelection', channel.uniqueName)
            "
          />
        </div>
      </div>
      <div class="pt-3">
        <p class="px-3 text-sm font-semibold uppercase text-gray-700 dark:text-gray-300">
          All Forums
        </p>
        <div
          v-for="channel in regularChannels"
          :key="channel.uniqueName"
          class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <SearchableForumListItem
            :channel="channel"
            :selected="selected"
            @toggle-selection="
              () => emit('toggleSelection', channel.uniqueName)
            "
          />
        </div>
      </div>
    </template>
  </div>
</template>
<style>
.touch-scroll-y {
  -webkit-overflow-scrolling: touch;
}
</style>
