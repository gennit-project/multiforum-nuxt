/**
 * Composable for shared filter bar logic between DiscussionFilterBar and EventFilterBar
 *
 * This extracts the common patterns:
 * - channelId extraction from route params
 * - defaultFilterLabels
 * - Channel/tag selection handlers
 * - Search input handler
 * - Toggle selection helpers
 * - Label computation helpers
 */

import { computed, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { updateFilters } from '@/utils/routerUtils';
import { getTagLabel, getChannelLabel } from '@/utils';

export const DEFAULT_FILTER_LABELS = {
  channels: 'All Forums',
  tags: 'Tags',
} as const;

export type FilterValues = {
  channels?: string[];
  tags?: string[];
  searchInput?: string;
  showArchived?: boolean;
  [key: string]: unknown;
};

type UseFilterBarParams<T extends FilterValues> = {
  getFilterValuesFromParams: (params: {
    route: ReturnType<typeof useRoute>;
    channelId: string;
    [key: string]: unknown;
  }) => T;
  additionalParseParams?: Record<string, unknown>;
};

export function useFilterBar<T extends FilterValues>(
  params: UseFilterBarParams<T>
) {
  const { getFilterValuesFromParams, additionalParseParams = {} } = params;

  const route = useRoute();
  const router = useRouter();

  // Computed property for channelId from route params
  const channelId = computed(() => {
    if (typeof route.params.forumId === 'string') {
      return route.params.forumId;
    }
    return '';
  });

  // Local reactive state for filter values (always initialized with a valid value)
  const filterValues: Ref<T> = ref(
    getFilterValuesFromParams({
      route,
      channelId: channelId.value,
      ...additionalParseParams,
    })
  ) as Ref<T>;

  // Computed properties for labels
  const channelLabel = computed(() =>
    getChannelLabel(filterValues.value.channels || [])
  );

  const tagLabel = computed(() =>
    getTagLabel(filterValues.value.tags || [])
  );

  // Watch for route query changes to update filter values
  watch(
    () => route.query,
    () => {
      if (route.query) {
        filterValues.value = getFilterValuesFromParams({
          route,
          channelId: channelId.value,
          ...additionalParseParams,
        });
      }
    }
  );

  // --- Filter update functions ---

  const setSelectedChannels = (channels: string[]) => {
    updateFilters({
      router,
      route,
      params: { channels },
    });
  };

  const setSelectedTags = (tags: string[]) => {
    updateFilters({
      router,
      route,
      params: { tags },
    });
  };

  const updateSearchInput = (searchInput: string) => {
    updateFilters({
      router,
      route,
      params: { searchInput },
    });
  };

  const updateShowArchived = (event: Event) => {
    const checkbox = event.target as HTMLInputElement;
    updateFilters({
      router,
      route,
      params: { showArchived: checkbox.checked },
    });
  };

  // --- Toggle selection helpers ---

  const toggleSelectedChannel = (channel: string) => {
    if (!filterValues.value.channels) {
      filterValues.value.channels = [];
    }
    const index = filterValues.value.channels.indexOf(channel);
    if (index === -1) {
      filterValues.value.channels.push(channel);
    } else {
      filterValues.value.channels.splice(index, 1);
    }
    setSelectedChannels(filterValues.value.channels);
  };

  const toggleSelectedTag = (tag: string) => {
    if (!filterValues.value.tags) {
      filterValues.value.tags = [];
    }
    const index = filterValues.value.tags.indexOf(tag);
    if (index === -1) {
      filterValues.value.tags.push(tag);
    } else {
      filterValues.value.tags.splice(index, 1);
    }
    setSelectedTags(filterValues.value.tags);
  };

  // --- Generic filter update helper ---

  const updateFilter = <K extends string>(
    paramName: K,
    value: unknown,
    clearIfFalsy = false
  ) => {
    if (clearIfFalsy && !value) {
      updateFilters({
        router,
        route,
        params: { [paramName]: undefined },
      });
    } else {
      updateFilters({
        router,
        route,
        params: { [paramName]: value },
      });
    }
  };

  return {
    // Routing
    route,
    router,
    channelId,

    // Filter state
    filterValues,

    // Labels
    channelLabel,
    tagLabel,

    // Filter update functions
    setSelectedChannels,
    setSelectedTags,
    updateSearchInput,
    updateShowArchived,
    updateFilter,

    // Toggle helpers
    toggleSelectedChannel,
    toggleSelectedTag,

    // Constants
    defaultFilterLabels: DEFAULT_FILTER_LABELS,
  };
}
