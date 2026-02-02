<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import type { DistanceUnit, SearchEventValues } from '@/types/Event';
import type { UpdateLocationInput } from '@/components/event/form/CreateEditEventFields.vue';
import LocationSearchBar from '@/components/event/list/filters/LocationSearchBar.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import TagIcon from '@/components/icons/TagIcon.vue';
import FilterIcon from '@/components/icons/FilterIcon.vue';
import SearchBar from '../../../SearchBar.vue';
import {
  distanceOptionsForKilometers,
  distanceOptionsForMiles,
  MilesOrKm,
} from '@/components/event/list/filters/eventSearchOptions';
import { LocationFilterTypes } from './locationFilterTypes';
import { getFilterValuesFromParams } from '@/components/event/list/filters/getEventFilterValuesFromParams';
import GenericButton from '@/components/GenericButton.vue';
import FilterChip from '@/components/FilterChip.vue';
import SelectCanceled from './SelectCanceled.vue';
import SelectFree from './SelectFree.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import SearchableTagList from '@/components/SearchableTagList.vue';
import { updateFilters } from '@/utils/routerUtils';
import PrimaryButton from '@/components/PrimaryButton.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import {
  useFilterBar,
  DEFAULT_FILTER_LABELS,
} from '@/composables/useFilterBar';
// Import Popper dynamically to avoid SSR issues with regeneratorRuntime
const Popper = defineAsyncComponent(() => import('vue3-popper'));

// Props
const props = defineProps({
  allowHidingMainFilters: {
    type: Boolean,
    default: false,
  },
  showMap: {
    type: Boolean,
    default: false,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  showMainFiltersByDefault: {
    type: Boolean,
    default: false,
  },
  toggleShowArchivedEnabled: {
    type: Boolean,
    default: false,
  },
  // When true, hide the "Hide filters" button in EventFilterBar (parent will render it)
  hideFiltersButtonExternally: {
    type: Boolean,
    default: false,
  },
  // When true, show "New Event" button next to search bar instead of in header
  showNewEventNextToSearchBar: {
    type: Boolean,
    default: false,
  },
  // External control of filter visibility (for when hideFiltersButtonExternally is true)
  externalShowMainFilters: {
    type: Boolean,
    default: undefined,
  },
});

// Use shared filter bar composable
const {
  route,
  router,
  channelId,
  filterValues,
  channelLabel,
  tagLabel,
  updateSearchInput,
  updateShowArchived,
  toggleSelectedChannel,
  toggleSelectedTag,
} = useFilterBar<SearchEventValues>({
  getFilterValuesFromParams: (params) => {
    const showOnlineOnly = params.route.name === 'SearchEventsList';
    const showInPersonOnly =
      params.route.name &&
      typeof params.route.name === 'string' &&
      params.route.name.includes('map-search')
        ? true
        : undefined;
    return getFilterValuesFromParams({
      route: params.route,
      channelId: params.channelId,
      showOnlineOnly,
      showInPersonOnly,
    });
  },
});

// Default filter labels (use shared constant)
const defaultFilterLabels = DEFAULT_FILTER_LABELS;

const createEventLink = computed(() => {
  if (channelId.value) {
    return `/forums/${channelId.value}/events/create`;
  }
  return '/events/create';
});

const showOnlineOnly = computed(() => route.name === 'SearchEventsList');
const showInPersonOnly = computed(() => {
  return route.name &&
    typeof route.name === 'string' &&
    route.name.includes('map-search')
    ? true
    : undefined;
});

const showLocationSearchBarAndDistanceButtons = computed(() => {
  const path = route.path;
  return path.includes('map') || channelId.value !== '';
});

const selectedDistanceUnit = ref(MilesOrKm.MI);

const referencePointName = computed(() => {
  return filterValues.value.placeName;
});

const radiusLabel = computed(() => {
  const distance = filterValues.value.radius;
  if (filterValues.value.radius === 0) {
    return 'Any distance';
  }
  const unit = selectedDistanceUnit.value;
  if (unit === MilesOrKm.KM) {
    return `${distance} km`;
  }
  return distance ? `${Math.round(distance / 1.609)} mi` : '';
});

// Note: Route query watching is handled by useFilterBar composable

const updateLocationInput = (placeData: UpdateLocationInput) => {
  updateFilters({
    router,
    route,
    params: {
      latitude: placeData.lat,
      longitude: placeData.lng,
      placeName: placeData.name,
      placeAddress: placeData.formatted_address,
    },
  });
};

const updateShowCanceled = (showCanceledEvents: boolean) => {
  if (showCanceledEvents) {
    updateFilters({
      router,
      route,
      params: { showCanceledEvents },
    });
  } else {
    updateFilters({
      router,
      route,
      params: { showCanceledEvents: undefined },
    });
  }
};

const updateShowOnlyFree = (showOnlyFreeEvents: boolean) => {
  if (showOnlyFreeEvents) {
    updateFilters({
      router,
      route,
      params: { showOnlyFreeEvents },
    });
  } else {
    updateFilters({
      router,
      route,
      params: { showOnlyFreeEvents: undefined },
    });
  }
};

const updateSelectedDistance = (distance: DistanceUnit) => {
  if (distance.value === 0) {
    updateFilters({
      router,
      route,
      params: {
        locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
        radius: 0,
      },
    });
  } else {
    const d =
      typeof distance.value === 'string'
        ? parseInt(distance.value, 10)
        : distance.value;
    updateFilters({
      route,
      router,
      params: { radius: d },
    });
  }
};

const internalShowMainFilters = ref(props.showMainFiltersByDefault);

// Use external control when provided, otherwise use internal state
const showMainFilters = computed(() => {
  if (props.externalShowMainFilters !== undefined) {
    return props.externalShowMainFilters;
  }
  return internalShowMainFilters.value;
});

const toggleShowMainFilters = () => {
  internalShowMainFilters.value = !internalShowMainFilters.value;
};

// Note: toggleSelectedChannel and toggleSelectedTag are provided by useFilterBar composable

type ChannelOption = {
  uniqueName: string;
  displayName: string;
  icon: string;
  description: string;
};
const IN_PERSON_FEATURED_FORUMS: ChannelOption[] = [
  {
    uniqueName: 'free_events',
    displayName: 'Free Events',
    icon: '',
    description: '',
  },
  {
    uniqueName: 'family_friendly_events',
    displayName: 'Family Friendly Events',
    icon: '',
    description: '',
  },
  {
    uniqueName: 'phx_concerts',
    displayName: 'Live Music in Phoenix',
    icon: '',
    description: '',
  },
];
// Note: updateShowArchived is provided by useFilterBar composable
</script>

<template>
  <div
    class="mt-1 flex-1 flex-col space-y-1 dark:text-white"
    :class="[showMap ? 'w-full px-4' : 'mx-4']"
  >
    <div
      v-if="
        allowHidingMainFilters &&
        !hideFiltersButtonExternally &&
        !showNewEventNextToSearchBar
      "
      class="mb-2 flex justify-end"
    >
      <button
        class="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-700"
        :class="[showMainFilters ? 'bg-gray-200 dark:bg-gray-700' : '']"
        data-testid="toggle-main-filters-button"
        @click="toggleShowMainFilters"
      >
        {{ showMainFilters ? 'Hide filters' : 'Show filters' }}
      </button>
      <RequireAuth :full-width="false">
        <template #has-auth>
          <PrimaryButton
            class="mx-2"
            :label="'New Event'"
            @click="$router.push(createEventLink)"
          />
        </template>
        <template #does-not-have-auth>
          <PrimaryButton class="mx-2" :label="'New Event'" />
        </template>
      </RequireAuth>
    </div>
    <hr
      v-if="
        allowHidingMainFilters &&
        !hideFiltersButtonExternally &&
        !showNewEventNextToSearchBar
      "
      class="mb-2 border border-t-gray-500 dark:border-t-gray-600"
    >
    <div
      v-if="showMainFilters"
      class="flex flex-col gap-2 rounded-lg p-2 dark:bg-gray-800"
      :class="[
        allowHidingMainFilters
          ? 'border border-gray-400 dark:border-gray-600'
          : '',
      ]"
    >
      <div v-if="route.name !== 'EventDetail'" class="mb-2 w-full">
        <div class="flex items-center space-x-1">
          <div
            class="align-items flex hidden justify-center space-x-2 md:block"
          >
            <FilterChip
              v-if="!channelId"
              class="items-center align-middle"
              :data-testid="'forum-filter-button'"
              :highlighted="channelLabel !== defaultFilterLabels.channels"
              :label="channelLabel"
            >
              <template #icon>
                <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
              </template>
              <template #content>
                <div
                  class="relative w-96 bg-white dark:bg-gray-700"
                  data-testid="forum-list-dropdown"
                >
                  <SearchableForumList
                    :featured-forums="
                      showInPersonOnly ? IN_PERSON_FEATURED_FORUMS : undefined
                    "
                    :selected-channels="filterValues.channels"
                    @toggle-selection="toggleSelectedChannel"
                  />
                </div>
              </template>
            </FilterChip>
          </div>
          <SearchBar
            :auto-focus="false"
            class="flex-1"
            :full-width="true"
            :initial-value="filterValues.searchInput"
            :right-side-is-rounded="!showLocationSearchBarAndDistanceButtons"
            :search-placeholder="'Search'"
            :test-id="'event-search-bar'"
            @update-search-input="updateSearchInput"
          >
            <client-only>
              <Popper v-if="!showLocationSearchBarAndDistanceButtons">
                <template #default>
                  <button
                    class="absolute inset-y-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full p-2 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                    aria-label="More filters"
                    title="More filters"
                    data-testid="more-filters-button"
                  >
                    <FilterIcon class="h-4 w-4 dark:text-white" />
                  </button>
                </template>

                <template #content>
                  <div
                    class="flex flex-col gap-3 bg-white p-4 dark:bg-gray-700"
                    :class="[
                      allowHidingMainFilters
                        ? 'rounded-lg border border-gray-300'
                        : '',
                    ]"
                  >
                    <div v-if="showLocationSearchBarAndDistanceButtons">
                      <div
                        v-if="selectedDistanceUnit === MilesOrKm.KM"
                        class="flex flex-wrap gap-x-1 gap-y-3"
                      >
                        <GenericButton
                          v-for="distance in distanceOptionsForKilometers"
                          :key="distance.value"
                          :active="distance.value === filterValues.radius"
                          :data-testid="`distance-${distance.value}`"
                          :text="`${distance.label} ${distance.value !== 0 ? 'km' : ''}`"
                          @click="updateSelectedDistance(distance)"
                        />
                      </div>
                      <div v-else class="flex flex-wrap gap-x-1 gap-y-3">
                        <GenericButton
                          v-for="distance in distanceOptionsForMiles"
                          :key="distance.value"
                          :active="distance.value === filterValues.radius"
                          :data-testid="`distance-${distance.value}`"
                          :text="`${distance.label} ${distance.value !== 0 ? 'mi' : ''}`"
                          @click="updateSelectedDistance(distance)"
                        />
                      </div>
                    </div>

                    <SelectCanceled
                      :show-canceled="filterValues.showCanceledEvents || false"
                      @update-show-canceled="updateShowCanceled"
                    />

                    <SelectFree
                      :show-only-free="filterValues.free || false"
                      @update-show-only-free="updateShowOnlyFree"
                    />
                  </div>
                </template>
              </Popper>
            </client-only>
          </SearchBar>
          <LocationSearchBar
            v-if="showLocationSearchBarAndDistanceButtons"
            :auto-focus="false"
            class="flex-1"
            data-testid="event-drawer-location-search-bar"
            :left-side-is-rounded="false"
            :radius="radiusLabel"
            :reference-point-address-name="referencePointName"
            @update-location-input="updateLocationInput"
          >
            <client-only>
              <Popper v-if="showLocationSearchBarAndDistanceButtons">
                <template #default>
                  <button
                    class="absolute inset-y-0 right-2 m-1 flex cursor-pointer items-center justify-center rounded-full bg-white p-2 dark:bg-gray-700 dark:text-white"
                    aria-label="More filters"
                    title="More filters"
                    data-testid="more-filters-button"
                  >
                    <FilterIcon
                      class="h-4 w-4 bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </button>
                </template>

                <template #content>
                  <div
                    class="flex flex-col gap-3 rounded-lg border border-gray-300 bg-white p-4 dark:bg-gray-700"
                  >
                    <div v-if="showLocationSearchBarAndDistanceButtons">
                      <div
                        v-if="selectedDistanceUnit === MilesOrKm.KM"
                        class="flex flex-wrap gap-x-1 gap-y-3"
                      >
                        <GenericButton
                          v-for="distance in distanceOptionsForKilometers"
                          :key="distance.value"
                          :active="distance.value === filterValues.radius"
                          :data-testid="`distance-${distance.value}`"
                          :text="`${distance.label} ${distance.value !== 0 ? 'km' : ''}`"
                          @click="updateSelectedDistance(distance)"
                        />
                      </div>
                      <div v-else class="flex flex-wrap gap-x-1 gap-y-3">
                        <GenericButton
                          v-for="distance in distanceOptionsForMiles"
                          :key="distance.value"
                          :active="distance.value === filterValues.radius"
                          :data-testid="`distance-${distance.value}`"
                          :text="`${distance.label} ${distance.value !== 0 ? 'mi' : ''}`"
                          @click="updateSelectedDistance(distance)"
                        />
                      </div>
                    </div>

                    <SelectCanceled
                      :show-canceled="filterValues.showCanceledEvents || false"
                      @update-show-canceled="updateShowCanceled"
                    />

                    <SelectFree
                      :show-only-free="filterValues.free || false"
                      @update-show-only-free="updateShowOnlyFree"
                    />
                  </div>
                </template>
              </Popper>
            </client-only>
          </LocationSearchBar>
          <!-- New Event button next to search bar (for online list view) -->
          <RequireAuth v-if="showNewEventNextToSearchBar" :full-width="false">
            <template #has-auth>
              <PrimaryButton
                class="ml-2 whitespace-nowrap"
                :label="'New Event'"
                @click="$router.push(createEventLink)"
              />
            </template>
            <template #does-not-have-auth>
              <PrimaryButton
                class="ml-2 whitespace-nowrap"
                :label="'New Event'"
              />
            </template>
          </RequireAuth>
        </div>
        <div v-if="!channelId" class="mt-4 flex items-center md:hidden">
          <FilterChip
            class="items-center align-middle"
            :data-testid="'forum-filter-button'"
            :highlighted="channelLabel !== defaultFilterLabels.channels"
            :label="channelLabel"
          >
            <template #icon>
              <ChannelIcon aria-hidden="true" class="-ml-0.5 mr-2 h-4 w-4" />
            </template>
            <template #content>
              <div
                class="relative w-80 max-w-screen-sm bg-white dark:bg-gray-700"
                data-testid="forum-list-dropdown-mobile"
              >
                <SearchableForumList
                  :featured-forums="
                    showInPersonOnly ? IN_PERSON_FEATURED_FORUMS : []
                  "
                  :selected-channels="filterValues.channels"
                  @toggle-selection="toggleSelectedChannel"
                />
              </div>
            </template>
          </FilterChip>
        </div>
      </div>
      <slot />
      <div
        v-if="toggleShowArchivedEnabled"
        class="flex flex-wrap items-center justify-start gap-4 py-2 dark:text-gray-300"
      >
        <CheckBox
          :checked="filterValues.showArchived"
          data-testid="show-archived-discussions"
          :label="'Show archived events'"
          @input="updateShowArchived"
        />
        <!-- Tags dropdown moved here -->
        <FilterChip
          class="items-center align-middle"
          data-testid="tag-filter-button"
          :highlighted="tagLabel !== defaultFilterLabels.tags"
          :label="tagLabel"
        >
          <template #icon>
            <TagIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <div class="relative w-96">
              <SearchableTagList
                :selected-tags="filterValues.tags"
                @toggle-selection="toggleSelectedTag"
              />
            </div>
          </template>
        </FilterChip>
      </div>
    </div>
  </div>
</template>
<style>
.tagpicker {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  max-width: 600px;
}
</style>
