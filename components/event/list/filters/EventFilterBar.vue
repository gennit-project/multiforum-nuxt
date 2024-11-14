<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import LocationSearchBar from "@/components/event/list/filters/LocationSearchBar.vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";
import TagIcon from "@/components/icons/TagIcon.vue";
import { getTagLabel, getChannelLabel } from "@/utils";
import SearchBar from "../../../SearchBar.vue";
import type { DistanceUnit, SearchEventValues } from "@/types/Event";
import {
  distanceOptionsForKilometers,
  distanceOptionsForMiles,
  MilesOrKm,
} from "@/components/event/list/filters/eventSearchOptions";
import LocationFilterTypes from "./locationFilterTypes";
import FilterIcon from "@/components/icons/FilterIcon.vue";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import GenericButton from "@/components/GenericButton.vue";
import FilterChip from "@/components/FilterChip.vue";
import SelectCanceled from "./SelectCanceled.vue";
import SelectFree from "./SelectFree.vue";
import Popper from "vue3-popper";
import type { UpdateLocationInput } from "@/components/event/form/CreateEditEventFields.vue";
import SearchableForumList from "@/components/channel/SearchableForumList.vue";
import SearchableTagList from "@/components/SearchableTagList.vue";

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
});

// Setup function
const route = useRoute();
const router = useRouter();

const defaultFilterLabels = {
  channels: "Forums",
  tags: "Tags",
};

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const showOnlineOnly = computed(() => route.name === "SearchEventsList");
const showInPersonOnly = computed(() => route.name === "MapEventPreview");

const filterValues = ref(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
    showOnlineOnly: showOnlineOnly.value,
    showInPersonOnly: showInPersonOnly.value,
  })
);

const channelLabel = computed(() => {
  return getChannelLabel(filterValues.value.channels);
});

const tagLabel = computed(() => {
  return getTagLabel(filterValues.value.tags);
});

const showLocationSearchBarAndDistanceButtons = computed(() => {
  const path = route.path;
  return path.includes("map") || channelId.value !== "";
});

const selectedDistanceUnit = ref(MilesOrKm.MI);

const referencePointName = computed(() => {
  return filterValues.value.placeName;
});

const radiusLabel = computed(() => {
  const distance = filterValues.value.radius;
  if (filterValues.value.radius === 0) {
    return "Any distance";
  }
  const unit = selectedDistanceUnit.value;
  if (unit === MilesOrKm.KM) {
    return `${distance} km`;
  }
  return distance ? `${Math.round(distance / 1.609)} mi` : "";
});

// Watcher to update filters on query change
watch(
  () => route.query,
  () => {
    filterValues.value = getFilterValuesFromParams({
      route,
      channelId: channelId.value,
      showOnlineOnly: showOnlineOnly.value,
      showInPersonOnly: showInPersonOnly.value,
    });
  },
  { immediate: true }
);

const updateFilters = (params: any) => {
  const isEmpty = (val: any) => val === "" || val === "[]" || val === undefined;

  const paramsWithoutEmptyValues = Object.keys(params).reduce(
    (acc: any, key: string) => {
      if (!isEmpty(params[key])) {
        acc[key] = params[key];
      }
      return acc;
    },
    {}
  );

  const existingQueryCopy: { [key: string]: any } = { ...route.query };

  router.replace({
    ...route,
    query: {
      ...existingQueryCopy,
      ...paramsWithoutEmptyValues,
    },
  });
};

const updateLocalState = (params: SearchEventValues) => {
  filterValues.value = {
    ...filterValues.value,
    ...params,
  };
};

const setSelectedChannels = (channels: string[]) => {
  updateLocalState({ channels });
  updateFilters({ channels });
};

const setSelectedTags = (tags: string[]) => {
  updateLocalState({ tags });
  updateFilters({ tags });
};

const updateSearchInput = (searchInput: string) => {
  updateLocalState({ searchInput });
  updateFilters({ searchInput });
};

const updateLocationInput = (placeData: UpdateLocationInput) => {
  updateFilters({
    latitude: placeData.lat,
    longitude: placeData.lng,
    placeName: placeData.name,
    placeAddress: placeData.formatted_address,
  });
  updateLocalState({
    latitude: placeData.lat,
    longitude: placeData.lng,
    placeName: placeData.name,
    placeAddress: placeData.formatted_address,
  });
};

const updateShowCanceled = (showCanceledEvents: boolean) => {
  if (showCanceledEvents) {
    updateFilters({ showCanceledEvents });
  } else {
    updateFilters({ showCanceledEvents: undefined });
  }
};

const updateShowOnlyFree = (showOnlyFreeEvents: boolean) => {
  if (showOnlyFreeEvents) {
    updateFilters({ showOnlyFreeEvents });
  } else {
    updateFilters({ showOnlyFreeEvents: undefined });
  }
};

const updateSelectedDistance = (distance: DistanceUnit) => {
  if (distance.value === 0) {
    updateFilters({ locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS });
    updateLocalState({ locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS });
    updateFilters({ radius: 0 });
  } else {
    const d =
      typeof distance.value === "string"
        ? parseInt(distance.value, 10)
        : distance.value;
    updateFilters({ radius: d });
  }
};

const showMainFilters = ref(props.showMainFiltersByDefault);

const toggleShowMainFilters = () => {
  showMainFilters.value = !showMainFilters.value;
};

const toggleSelectedChannel = (channel: string) => {
  const index = filterValues.value.channels.indexOf(channel);
  if (index === -1) {
    filterValues.value.channels.push(channel);
  } else {
    filterValues.value.channels.splice(index, 1);
  }
  setSelectedChannels(filterValues.value.channels);
};

const toggleSelectedTag = (tag: string) => {
  const index = filterValues.value.tags.indexOf(tag);
  if (index === -1) {
    filterValues.value.tags.push(tag);
  } else {
    filterValues.value.tags.splice(index, 1);
  }
  setSelectedTags(filterValues.value.tags);
};
</script>

<template>
  <div class="w-full flex-col space-y-1 dark:text-white mt-2">
    <div v-if="showMainFilters" class="flex flex-col gap-2">
      <div v-if="route.name !== 'EventDetail'" class="mb-2 w-full">
        <div class="flex space-x-1 align-items">
          <div class="flex space-x-2 items-center justify-center">
            <FilterChip
              v-if="!channelId"
              class="ml-4 items-center align-middle"
              data-testid="channel-filter-button"
              :label="channelLabel"
              :highlighted="channelLabel !== defaultFilterLabels.channels"
            >
              <template #icon>
                <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
              </template>
              <template #content>
                <div class="relative bg-white dark:bg-gray-700 w-96">
                  <SearchableForumList
                    :selected-channels="filterValues.channels"
                    @toggle-selection="toggleSelectedChannel"
                  />
                </div>
              </template>
            </FilterChip>
          </div>
          <SearchBar
            class="flex-1"
            data-testid="event-drawer-search-bar"
            :initial-value="filterValues.searchInput"
            :search-placeholder="'Search'"
            :full-width="true"
            :right-side-is-rounded="!showLocationSearchBarAndDistanceButtons"
            @update-search-input="updateSearchInput"
          >
            <client-only>
              <Popper v-if="!showLocationSearchBarAndDistanceButtons">
                <button
                  data-testid="more-filters-button"
                  class="absolute inset-y-0 right-2 flex rounded-full cursor-pointer items-center bg-white dark:text-white dark:bg-gray-700 pr-3"
                >
                  <FilterIcon class="h-4 w-4" />
                </button>

                <template #content>
                  <div
                    class="flex flex-col gap-3 rounded-lg border border-gray-500 bg-white p-4 dark:bg-gray-700"
                  >
                    <div v-if="showLocationSearchBarAndDistanceButtons">
                      <div
                        v-if="selectedDistanceUnit === MilesOrKm.KM"
                        class="flex flex-wrap gap-x-1 gap-y-3"
                      >
                        <GenericButton
                          v-for="distance in distanceOptionsForKilometers"
                          :key="distance.value"
                          :data-testid="`distance-${distance.value}`"
                          :text="`${distance.label} ${distance.value !== 0 ? 'km' : ''}`"
                          :active="distance.value === filterValues.radius"
                          @click="updateSelectedDistance(distance)"
                        />
                      </div>
                      <div v-else class="flex flex-wrap gap-x-1 gap-y-3">
                        <GenericButton
                          v-for="distance in distanceOptionsForMiles"
                          :key="distance.value"
                          :data-testid="`distance-${distance.value}`"
                          :text="`${distance.label} ${distance.value !== 0 ? 'mi' : ''}`"
                          :active="distance.value === filterValues.radius"
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
            class="flex-1"
            data-testid="event-drawer-location-search-bar"
            :reference-point-address-name="referencePointName"
            :left-side-is-rounded="false"
            :radius="radiusLabel"
            @update-location-input="updateLocationInput"
          >
            <Popper v-if="showLocationSearchBarAndDistanceButtons">
              <button
                data-testid="more-filters-button"
                class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
              >
                <FilterIcon class="h-4 w-4 bg-white dark:bg-gray-700" />
              </button>

              <template #content>
                <div
                  class="flex flex-col gap-3 rounded-lg border border-gray-500 bg-white p-4 dark:bg-gray-700"
                >
                  <div v-if="showLocationSearchBarAndDistanceButtons">
                    <div
                      v-if="selectedDistanceUnit === MilesOrKm.KM"
                      class="flex flex-wrap gap-x-1 gap-y-3"
                    >
                      <GenericButton
                        v-for="distance in distanceOptionsForKilometers"
                        :key="distance.value"
                        :data-testid="`distance-${distance.value}`"
                        :text="`${distance.label} ${distance.value !== 0 ? 'km' : ''}`"
                        :active="distance.value === filterValues.radius"
                        @click="updateSelectedDistance(distance)"
                      />
                    </div>
                    <div v-else class="flex flex-wrap gap-x-1 gap-y-3">
                      <GenericButton
                        v-for="distance in distanceOptionsForMiles"
                        :key="distance.value"
                        :data-testid="`distance-${distance.value}`"
                        :text="`${distance.label} ${distance.value !== 0 ? 'mi' : ''}`"
                        :active="distance.value === filterValues.radius"
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
          </LocationSearchBar>
          <div class="flex space-x-2 items-center justify-center">
            <FilterChip
              class="items-center align-middle"
              data-testid="tag-filter-button"
              :label="tagLabel"
              :highlighted="tagLabel !== defaultFilterLabels.tags"
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
      <slot />
    </div>

    <div class="flex items-center justify-end">
      <button
        v-if="allowHidingMainFilters"
        class="mr-4 text-blue-500"
        @click="toggleShowMainFilters"
      >
        {{ showMainFilters ? "Hide filters" : "Show filters" }}
      </button>
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
