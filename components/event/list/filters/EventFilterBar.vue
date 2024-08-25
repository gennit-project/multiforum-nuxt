<script lang="ts">
import { defineComponent, computed, ref, Ref } from "vue";
import LocationSearchBar from "@/components/event/list/filters/LocationSearchBar.vue";
// import TagPicker from "@/components/TagPicker.vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";
import TagIcon from "@/components/icons/TagIcon.vue";
import { getTagLabel, getChannelLabel } from "@/components/utils";
import SearchBar from "../../../SearchBar.vue";
import { DistanceUnit, SearchEventValues } from "@/types/Event";
import {
  distanceOptionsForKilometers,
  distanceOptionsForMiles,
  MilesOrKm,
  distanceUnitOptions,
} from "@/components/event/list/filters/eventSearchOptions";
import LocationFilterTypes from "./locationFilterTypes";
import FilterIcon from "@/components/icons/FilterIcon.vue";
import { SelectedWeekdays, SelectedHourRanges } from "@/types/Event";
import { useRoute, useRouter } from "vue-router";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import {
  defaultSelectedWeekdays,
  defaultSelectedHourRanges,
  defaultSelectedWeeklyHourRanges,
} from "./eventSearchOptions";
import GenericButton from "@/components/buttons/GenericButton.vue";
import FilterChip from "@/components/buttons/FilterChip.vue";
import SelectCanceled from "./SelectCanceled.vue";
import SelectFree from "./SelectFree.vue";
import Popper from "vue3-popper";
import { UpdateLocationInput } from "@/components/event/form/CreateEditEventFields.vue";
import SearchableForumList from "@/components/channel/SearchableForumList.vue";
import SearchableTagList from "@/components/forms/SearchableTagList.vue";

export default defineComponent({
  name: "EventFilterBar",
  // The EventFilterBar component writes to the query
  // params, while the MapView and EventListView
  // components consume the query params, using those
  // for filtering.
  components: {
    ChannelIcon,
    FilterChip,
    FilterIcon,
    GenericButton,
    LocationSearchBar,
    Popper,
    SearchableForumList,
    SearchableTagList,
    SearchBar,
    SelectCanceled,
    SelectFree,
    TagIcon,
  },
  props: {
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
  },

  setup(props) {
    const defaultFilterLabels = {
      channels: "Forums",
      tags: "Tags",
    };
    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    const route = useRoute();
    const router = useRouter();
    const showOnlineOnly = route.name === "SearchEventsList";
    const showInPersonOnly = route.name === "MapEventPreview";

    const filterValues: Ref<SearchEventValues> = ref(
      getFilterValuesFromParams({
        route,
        channelId: channelId.value,
        showOnlineOnly,
        showInPersonOnly,
      }),
    );

    const channelLabel = computed(() => {
      return getChannelLabel(filterValues.value.channels);
    });

    const tagLabel = computed(() => {
      return getTagLabel(filterValues.value.tags);
    });

    const activeDateShortcut = ref(route.query.timeShortcut);

    const moreFiltersLabel = computed(() => {
      const labels = [];
      const locationFilter = filterValues.value.locationFilter;
      if (locationFilter !== LocationFilterTypes.NONE) {
        if (locationFilter === LocationFilterTypes.ONLY_VIRTUAL) {
          labels.push("Online events");
        }

        if (
          locationFilter === LocationFilterTypes.ONLY_WITH_ADDRESS ||
          locationFilter === LocationFilterTypes.WITHIN_RADIUS
        ) {
          labels.push("In-person events");
        }
      }

      if (labels.length === 1) {
        return labels[0];
      }

      return labels.join(", ");
    });

    const currentDistanceIndex = distanceOptionsForKilometers.findIndex(
      (val: DistanceUnit) => {
        return filterValues.value.radius === val.value;
      },
    );
    const defaultMileSelection = ref(
      distanceOptionsForMiles[currentDistanceIndex],
    );
    const defaultKilometerSelection = ref(
      distanceOptionsForKilometers[currentDistanceIndex],
    );

    const hourRanges: Ref<SelectedHourRanges> = ref({});
    const weekdays: Ref<SelectedWeekdays> = ref({});

    const showLocationSearchBarAndDistanceButtons = computed(() => {
      const path = route.path;
      return path.includes("map") || channelId.value !== "";
    });

    const selectedDistanceUnit = ref(MilesOrKm.MI);

    const displayDistance = computed(() => {
      const distance = filterValues.value.radius;
      if (filterValues.value.radius === 0) {
        return "Any distance";
      }
      const unit = selectedDistanceUnit.value;
      if (unit === MilesOrKm.KM) {
        return `${distance} km`;
      }
      // If miles are selected, convert to miles.
      return distance ? `${Math.round(distance / 1.609)} mi` : "";
    });

    const referencePointName = computed(() => {
      return filterValues.value.placeName;
    });

    const referencePointAddress = computed(() => {
      return filterValues.value.placeAddress;
    });

    const createEventPath = channelId.value
      ? `/channels/c/${channelId.value}/events/create`
      : "/events/create";

    const radiusLabel = computed(() => {
      const distance = filterValues.value.radius;
      if (filterValues.value.radius === 0) {
        return "Any distance";
      }
      const unit = selectedDistanceUnit.value;
      if (unit === MilesOrKm.KM) {
        return `${distance} km`;
      }
      // If miles are selected, convert to miles.
      return distance ? `${Math.round(distance / 1.609)} mi` : "";
    });
    return {
      activeDateShortcut,
      activeEventFilterTypeShortcut: ref(filterValues.value.locationFilter),
      channelId,
      channelLabel,
      createEventPath,
      defaultFilterLabels,
      defaultKilometerSelection,
      defaultMileSelection,
      defaultSelectedWeekdays,
      defaultSelectedHourRanges,
      defaultSelectedWeeklyHourRanges,
      displayDistance,
      distanceOptionsForKilometers,
      distanceOptionsForMiles,
      distanceUnitOptions,
      drawerIsOpen: ref(false),
      filterValues,
      hourRanges,
      LocationFilterTypes,
      MI_KM_RATIO: 1.609,
      MilesOrKm,
      moreFiltersLabel,
      radiusLabel,
      referencePointName,
      referencePointAddress,
      route,
      router,
      selectedDistanceUnit,
      showLocationSearchBarAndDistanceButtons,
      showOnlineOnly,
      showInPersonOnly,
      showMainFilters: ref(props.showMainFiltersByDefault),
      showTimeSlotPicker: ref(false),
      tagLabel,
      timeSlotFiltersActive: ref(false),
      weekdays,
    };
  },
  created() {
    this.$watch("$route.query", () => {
      if (this.route.query) {
        this.filterValues = getFilterValuesFromParams({
          route: this.route,
          channelId: this.channelId,
          showOnlineOnly: this.showOnlineOnly,
          showInPersonOnly: this.showInPersonOnly,
        });
      }
    });
  },
  methods: {
    handleClickMoreFilters() {
      this.drawerIsOpen = true;
    },
    handleCloseFilters() {
      this.drawerIsOpen = false;
    },
    updateFilters(params: any) {
      const isEmpty = (val: any) => {
        return val === "" || val === "[]" || val === undefined;
      };
      const paramsWithEmptyValues = Object.keys(params).reduce(
        (acc: any, key: string) => {
          if (isEmpty(params[key])) {
            acc[key] = "";
          }
          return acc;
        },
        {},
      );
      const paramsWithoutEmptyValues = Object.keys(params).reduce(
        (acc: any, key: string) => {
          if (!isEmpty(params[key])) {
            acc[key] = params[key];
          }
          return acc;
        },
        {},
      );

      const existingQueryCopy = { ...this.$route.query };

      Object.keys(paramsWithEmptyValues).forEach((key: string) => {
        if (isEmpty(paramsWithEmptyValues[key])) {
          // If the newest filter is empty, we want to remove it from
          // the query params instead of adding a filter with an empty value.
          delete existingQueryCopy[key];
        }
      });
      // Updating the URL params causes the events
      // to be refetched by the EventListView
      // and MapView components. Events are refetched
      // if the filter is changed, while a cached
      // result is used if the filter has been
      // used before in the same session.
      this.$router.replace({
        ...this.$route,
        query: {
          ...existingQueryCopy,
          ...paramsWithoutEmptyValues,
        },
      });
    },
    updateLocalState(params: SearchEventValues) {
      // Updating filterValues updates local state
      // so that parts of the filter form don't get
      // outdated when a related setting is updated.
      const existingFilterValues = this.filterValues;
      this.filterValues = {
        ...existingFilterValues,
        ...params,
      };
    },
    setSelectedChannels(channels: string[]) {
      this.updateLocalState({ channels });
      this.updateFilters({ channels });
    },
    setSelectedTags(tags: string[]) {
      this.updateLocalState({ tags });
      this.updateFilters({ tags });
    },
    updateSearchInput(searchInput: string) {
      this.updateLocalState({ searchInput });
      this.updateFilters({ searchInput });
    },
    updateLocationInput(placeData: UpdateLocationInput) {
      try {
        this.updateFilters({
          latitude: placeData.lat,
          longitude: placeData.lng,
          placeName: placeData.name,
          placeAddress: placeData.formatted_address,
        });
        this.updateLocalState({
          latitude: placeData.lat,
          longitude: placeData.lng,
          placeName: placeData.name,
          placeAddress: placeData.formatted_address,
        });
        this.referencePointAddress = placeData.formatted_address;
      } catch (e: any) {
        throw new Error(e);
      }
    },
    updateSelectedDistanceUnit(unitOption: DistanceUnit) {
      if (
        this.selectedDistanceUnit === MilesOrKm.MI &&
        unitOption.value === MilesOrKm.KM
      ) {
        // Switch from miles to kilometers
        const currentDistanceIndex = distanceOptionsForMiles.findIndex(
          (val: DistanceUnit) => {
            return this.filterValues.radius.toString() === val.label;
          },
        );
        const newRadius =
          distanceOptionsForKilometers[currentDistanceIndex].value;
        this.updateLocalState({ radius: newRadius });
        this.updateFilters({ radius: newRadius });
      } else if (
        this.selectedDistanceUnit === MilesOrKm.KM &&
        unitOption.value === MilesOrKm.MI
      ) {
        // Switch from kilometers to miles
        const currentDistanceIndex = distanceOptionsForKilometers.findIndex(
          (val: DistanceUnit) => {
            return this.filterValues.radius.toString() === val.label;
          },
        );
        const newRadius = distanceOptionsForMiles[currentDistanceIndex].value;
        this.updateLocalState({ radius: newRadius });
        this.updateFilters({ radius: newRadius });
      }

      this.selectedDistanceUnit = unitOption.value;
    },
    resetTimeSlots() {
      // Remove values from query params
      const existingQueryCopy = { ...this.$route.query };
      delete existingQueryCopy.hourRanges;
      delete existingQueryCopy.weekdays;
      delete existingQueryCopy.weeklyHourRanges;
      this.$router.replace({
        query: existingQueryCopy,
      });

      // Update local state
      this.updateLocalState({
        weekdays: this.defaultSelectedWeekdays,
        hourRanges: this.defaultSelectedHourRanges,
        weeklyHourRanges: this.defaultSelectedWeeklyHourRanges,
      });
    },
    updateHourRanges(flattenedHourRanges: string) {
      this.updateFilters({ hourRanges: flattenedHourRanges });
    },
    updateWeekdays(flattenedWeekdays: string) {
      this.updateFilters({ weekdays: flattenedWeekdays });
    },
    resetWeekdays() {
      // Remove values from query params
      const existingQueryCopy = { ...this.$route.query };
      delete existingQueryCopy.weekdays;
      this.$router.replace({
        query: existingQueryCopy,
      });

      // Update local state
      this.updateLocalState({
        weekdays: this.defaultSelectedWeekdays,
      });
    },
    resetHourRanges() {
      // Remove values from query params
      const existingQueryCopy = { ...this.$route.query };
      delete existingQueryCopy.hourRanges;
      this.$router.replace({
        query: existingQueryCopy,
      });

      // Update local state
      this.updateLocalState({
        hourRanges: this.defaultSelectedHourRanges,
      });
    },
    updateTimeSlots(flattenedTimeFilters: string) {
      this.updateFilters({
        weeklyHourRanges: flattenedTimeFilters,
      });
    },
    updateShowCanceled(showCanceledEvents: boolean) {
      if (showCanceledEvents) {
        this.updateFilters({
          showCanceledEvents: showCanceledEvents,
        });
      } else {
        // remove the filter from the list of conditions
        this.updateFilters({
          showCanceledEvents: undefined,
        });
      }
    },
    updateShowOnlyFree(showOnlyFreeEvents: boolean) {
      if (showOnlyFreeEvents) {
        this.updateFilters({
          showOnlyFreeEvents: showOnlyFreeEvents,
        });
      } else {
        // remove the filter from the list of conditions
        this.updateFilters({
          showOnlyFreeEvents: undefined,
        });
      }
    },
    updateSelectedDistance(distance: DistanceUnit) {
      if (distance.value === 0) {
        // If the radius is 0 (Any distance), don't use a radius when
        // filtering events, but the results should still be limited
        // to events with in-person locations.
        this.updateFilters({
          locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
        });
        this.updateLocalState({
          locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
        });
        this.updateFilters({ radius: 0 });
      }
      let d: number = 0;

      if (typeof distance.value === "string") {
        d = parseInt(distance.value, 10);
      } else if (typeof distance.value === "number") {
        d = distance.value;
      }
      this.updateFilters({ radius: d });
    },
    toggleTimeSlotPicker() {
      this.showTimeSlotPicker = !this.showTimeSlotPicker;
    },
    toggleShowMainFilters() {
      this.showMainFilters = !this.showMainFilters;
    },
    toggleSelectedChannel(channel: string) {
      const index = this.filterValues.channels.indexOf(channel);
      if (index === -1) {
        this.filterValues.channels.push(channel);
      } else {
        this.filterValues.channels.splice(index, 1);
      }
      this.setSelectedChannels(this.filterValues.channels);
    },
    toggleSelectedTag(tag: string) {
      const index = this.filterValues.tags.indexOf(tag);
      if (index === -1) {
        this.filterValues.tags.push(tag);
      } else {
        this.filterValues.tags.splice(index, 1);
      }
      this.setSelectedTags(this.filterValues.tags);
    },
  },
});
</script>

<template>
  <div class="w-full space-y-1">
    <div class="mb-2 flex items-center justify-end">
      <button
        v-if="allowHidingMainFilters"
        class="mr-4 text-blue-500"
        @click="() => toggleShowMainFilters()"
      >
        {{ showMainFilters ? "Hide filters" : "Show filters" }}
      </button>
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
              @toggleSelection="toggleSelectedChannel"
            />
          </div>
        </template>
      </FilterChip>
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
              @toggleSelection="toggleSelectedTag"
            />
          </div>
        </template>
      </FilterChip>
    </div>
    <div
      v-if="showMainFilters"
      class="flex flex-col gap-2"
    >
      <div
        v-if="route.name !== 'EventDetail'"
        class="mb-2 w-full"
      >
        <div class="flex space-x-1 align-middle">
          <SearchBar
            class="flex-1"
            data-testid="event-drawer-search-bar"
            :initial-value="filterValues.searchInput"
            :search-placeholder="'Search'"
            :full-width="true"
            :right-side-is-rounded="!showLocationSearchBarAndDistanceButtons"
            @updateSearchInput="updateSearchInput"
          >
            <Popper v-if="!showLocationSearchBarAndDistanceButtons">
              <button
                data-testid="more-filters-button"
                class="absolute inset-y-0 right-2 flex rounded-full cursor-pointer items-center bg-white dark:bg-gray-700 pr-3"
                @click="handleClickMoreFilters"
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
                        :text="`${distance.label} ${
                          distance.value !== 0 ? 'km' : ''
                        }`"
                        :active="distance.value === filterValues.radius"
                        @click="updateSelectedDistance(distance)"
                      />
                    </div>
                    <div
                      v-else
                      class="flex flex-wrap gap-x-1 gap-y-3"
                    >
                      <GenericButton
                        v-for="distance in distanceOptionsForMiles"
                        :key="distance.value"
                        :data-testid="`distance-${distance.value}`"
                        :text="`${distance.label} ${
                          distance.value !== 0 ? 'mi' : ''
                        }`"
                        :active="distance.value === filterValues.radius"
                        @click="updateSelectedDistance(distance)"
                      />
                    </div>
                  </div>

                  <SelectCanceled
                    :show-canceled="filterValues.showCanceledEvents || false"
                    @updateShowCanceled="updateShowCanceled"
                  />

                  <SelectFree
                    :show-only-free="filterValues.free || false"
                    @updateShowOnlyFree="updateShowOnlyFree"
                  />
                </div>
              </template>
            </Popper>
          </SearchBar>
          <LocationSearchBar
            v-if="showLocationSearchBarAndDistanceButtons"
            class="flex-1"
            data-testid="event-drawer-location-search-bar"
            :reference-point-address-name="referencePointName"
            :left-side-is-rounded="false"
            :radius="radiusLabel"
            @updateLocationInput="updateLocationInput"
          >
            <Popper v-if="showLocationSearchBarAndDistanceButtons">
              <button
                data-testid="more-filters-button"
                class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
                @click="handleClickMoreFilters"
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
                        :text="`${distance.label} ${
                          distance.value !== 0 ? 'km' : ''
                        }`"
                        :active="distance.value === filterValues.radius"
                        @click="updateSelectedDistance(distance)"
                      />
                    </div>
                    <div
                      v-else
                      class="flex flex-wrap gap-x-1 gap-y-3"
                    >
                      <GenericButton
                        v-for="distance in distanceOptionsForMiles"
                        :key="distance.value"
                        :data-testid="`distance-${distance.value}`"
                        :text="`${distance.label} ${
                          distance.value !== 0 ? 'mi' : ''
                        }`"
                        :active="distance.value === filterValues.radius"
                        @click="
                          () => {
                            updateSelectedDistance(distance);
                          }
                        "
                      />
                    </div>
                  </div>

                  <SelectCanceled
                    :show-canceled="filterValues.showCanceledEvents || false"
                    @updateShowCanceled="updateShowCanceled"
                  />

                  <SelectFree
                    :show-only-free="filterValues.free || false"
                    @updateShowOnlyFree="updateShowOnlyFree"
                  />
                </div>
              </template>
            </Popper>
          </LocationSearchBar>
        </div>
      </div>
      <slot />
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
