<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
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
  import { getFilterValuesFromParams } from "@/components/event/list/filters/getEventFilterValuesFromParams";
  import GenericButton from "@/components/GenericButton.vue";
  import FilterChip from "@/components/FilterChip.vue";
  import SelectCanceled from "./SelectCanceled.vue";
  import SelectFree from "./SelectFree.vue";
  import type { UpdateLocationInput } from "@/components/event/form/CreateEditEventFields.vue";
  import SearchableForumList from "@/components/channel/SearchableForumList.vue";
  import SearchableTagList from "@/components/SearchableTagList.vue";
  import { updateFilters } from "@/utils/routerUtils";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";

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
  });

  // Setup function
  const route = useRoute();
  const router = useRouter();

  const defaultFilterLabels = {
    channels: "All Forums",
    tags: "Tags",
  };

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const showOnlineOnly = computed(() => route.name === "SearchEventsList");
  const showInPersonOnly = computed(() => {
    return route.name && typeof route.name === "string" && route.name.includes("map-search")
      ? true
      : undefined;
  });

  const filterValues = ref<SearchEventValues>(
    getFilterValuesFromParams({
      route,
      channelId: channelId.value,
      showOnlineOnly: showOnlineOnly.value,
      showInPersonOnly: showInPersonOnly.value,
    })
  );

  const channelLabel = computed(() => {
    return getChannelLabel(filterValues.value.channels || []);
  });

  const tagLabel = computed(() => {
    return getTagLabel(filterValues.value.tags || []);
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
      const d = typeof distance.value === "string" ? parseInt(distance.value, 10) : distance.value;
      updateFilters({
        route,
        router,
        params: { radius: d },
      });
    }
  };

  const showMainFilters = ref(props.showMainFiltersByDefault);

  const toggleShowMainFilters = () => {
    showMainFilters.value = !showMainFilters.value;
  };

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

  // Add a ref to track if the forum list is open
  const forumListOpen = ref(false);

  // Add a method to handle opening/closing
  const toggleForumList = () => {
    forumListOpen.value = !forumListOpen.value;
  };

  type ChannelOption = {
    uniqueName: string;
    displayName: string;
    icon: string;
    description: string;
  };
  const IN_PERSON_FEATURED_FORUMS: ChannelOption[] = [
    {
      uniqueName: "free_events",
      displayName: "Free Events",
      icon: "",
      description: "",
    },
    {
      uniqueName: "family_friendly_events",
      displayName: "Family Friendly Events",
      icon: "",
      description: "",
    },
    {
      uniqueName: "phx_concerts",
      displayName: "Live Music in Phoenix",
      icon: "",
      description: "",
    },
  ];
  const updateShowArchived = (event: Event) => {
    const checkbox = event.target as HTMLInputElement;
    updateFilters({
      router,
      route,
      params: { showArchived: checkbox.checked },
    });
  };
</script>

<template>
  <div class="mx-4 mt-2 flex-1 flex-col space-y-1 dark:text-white">
    <div class="mb-2 flex justify-end">
      <button
        v-if="allowHidingMainFilters"
        class="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:border-gray-300 dark:text-gray-300 dark:hover:bg-gray-700"
        :class="[showMainFilters ? 'bg-gray-200 dark:bg-gray-700' : '']"
        data-testid="toggle-main-filters-button"
        @click="toggleShowMainFilters"
      >
        {{ showMainFilters ? "Hide filters" : "Show filters" }}
      </button>
      <RequireAuth
        v-if="allowHidingMainFilters"
        :full-width="false"
      >
        <template #has-auth>
          <PrimaryButton
            class="mx-2"
            :label="'New Event'"
            @click="$router.push(`/forums/${channelId}/events/create`)"
          />
        </template>
        <template #does-not-have-auth>
          <PrimaryButton
            class="mx-2"
            :label="'New Event'"
          />
        </template>
      </RequireAuth>
    </div>
    <hr
      v-if="allowHidingMainFilters"
      class="mb-2 border border-t-gray-500 dark:border-t-gray-600"
    >
    <div
      v-if="showMainFilters"
      class="flex flex-col gap-2 rounded-lg p-4 dark:bg-gray-800"
      :class="[allowHidingMainFilters ? 'border border-gray-400 dark:border-gray-600' : '']"
    >
      <div
        v-if="route.name !== 'EventDetail'"
        class="mb-2 w-full"
      >
        <div class="flex items-center space-x-1">
          <div class="align-items flex hidden justify-center space-x-2 md:block">
            <FilterChip
              v-if="!channelId"
              class="items-center align-middle"
              :data-testid="'forum-filter-button'"
              :highlighted="channelLabel !== defaultFilterLabels.channels"
              :label="channelLabel"
              @click="toggleForumList"
            >
              <template #icon>
                <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
              </template>
              <template #content>
                <div
                  v-if="forumListOpen"
                  class="relative w-96 bg-white dark:bg-gray-700"
                  data-testid="forum-list-dropdown"
                >
                  <SearchableForumList
                    :featured-forums="showInPersonOnly ? IN_PERSON_FEATURED_FORUMS : undefined"
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
            <FloatingDropdown
              v-if="!showLocationSearchBarAndDistanceButtons"
              placement="bottom-end"
            >
              <template #trigger>
                <button
                  class="absolute inset-y-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full p-2 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                  data-testid="more-filters-button"
                >
                  <FilterIcon class="h-4 w-4 dark:text-white" />
                </button>
              </template>

              <template #content>
                <div
                  class="flex flex-col gap-3 bg-white p-4 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                  :class="[allowHidingMainFilters ? 'rounded-lg border border-gray-300' : '']"
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
                    <div
                      v-else
                      class="flex flex-wrap gap-x-1 gap-y-3"
                    >
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
            </FloatingDropdown>
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
            <FloatingDropdown
              v-if="showLocationSearchBarAndDistanceButtons"
              placement="bottom-end"
            >
              <template #trigger>
                <button
                  class="absolute top-1/2 right-2 -translate-y-1/2 flex cursor-pointer items-center justify-center rounded-full bg-white p-2 dark:bg-gray-700 dark:text-white"
                  data-testid="more-filters-button"
                >
                  <FilterIcon class="h-4 w-4 text-gray-600 dark:text-white" />
                </button>
              </template>

              <template #content>
                <div
                  class="flex flex-col gap-3 rounded-lg border border-gray-300 bg-white p-4 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
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
                    <div
                      v-else
                      class="flex flex-wrap gap-x-1 gap-y-3"
                    >
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
            </FloatingDropdown>
          </LocationSearchBar>
          <div class="flex hidden items-center justify-center space-x-2 md:block">
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
        <div class="mt-4 flex items-center md:hidden">
          <FilterChip
            v-if="!channelId"
            class="items-center align-middle"
            :data-testid="'forum-filter-button'"
            :highlighted="channelLabel !== defaultFilterLabels.channels"
            :label="channelLabel"
            @click="toggleForumList"
          >
            <template #icon>
              <ChannelIcon
                aria-hidden="true"
                class="-ml-0.5 mr-2 h-4 w-4"
              />
            </template>
            <template #content>
              <div
                v-if="forumListOpen"
                class="relative w-80 max-w-screen-sm bg-white dark:bg-gray-700"
                data-testid="forum-list-dropdown-mobile"
              >
                <SearchableForumList
                  :featured-forums="showInPersonOnly ? IN_PERSON_FEATURED_FORUMS : []"
                  :selected-channels="filterValues.channels"
                  @toggle-selection="toggleSelectedChannel"
                />
              </div>
            </template>
          </FilterChip>
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
      <slot />
      <div
        v-if="toggleShowArchivedEnabled"
        class="flex items-center justify-start gap-2 py-2 dark:text-gray-300"
      >
        <CheckBox
          :checked="filterValues.showArchived"
          class="align-middle"
          data-testid="show-archived-discussions"
          @input="updateShowArchived"
        />
        Show archived events
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
