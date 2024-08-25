<script lang="ts">
import { defineComponent, computed, ref, Ref } from "vue";
import { useRoute } from "vue-router";
import { timeFilterShortcuts } from "./eventSearchOptions";
import LocationFilterTypes from "./locationFilterTypes";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import { SearchEventValues } from "@/types/Event";
import Tag from "@/components/Tag.vue";

export default defineComponent({
  name: "TimeShortcuts",
  components: {
    Tag,
  },
  props: {
    isListView: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const route = useRoute();
    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    const filterValues: Ref<SearchEventValues> = ref(
      getFilterValuesFromParams({
        route,
        channelId: channelId.value,
        showOnlineOnly: props.isListView && !channelId.value
      })
    );
    return {
      activeDateShortcut: ref(route.query.timeShortcut),
      activeEventFilterTypeShortcut: ref(filterValues.value.locationFilter),
      channelId,
      filterValues,
      LocationFilterTypes: LocationFilterTypes,
      route,
      timeFilterShortcuts,
    };
  },
  created() {
    this.$watch("$route.query", () => {
      if (this.route.query) {
        this.filterValues = getFilterValuesFromParams({
          route: this.route,
          channelId: this.channelId,
          showOnlineOnly: this.isListView && !this.channelId
        });
      }
    });
  },
  methods: {
    updateFilters(params: SearchEventValues) {
      const existingQuery = this.$route.query;
      // Updating the URL params causes the events
      // to be refetched by the EventListView
      // and MapView components
      this.$router.replace({
        query: {
          ...existingQuery,
          ...params,
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
    handleTimeFilterShortcutClick(shortcut: string) {
      if (shortcut === this.activeDateShortcut) {
        // If the filter is currently selected, clear it.
        this.activeDateShortcut = this.timeFilterShortcuts.NONE;
        this.updateFilters({
          timeShortcut: this.timeFilterShortcuts.NONE,
        });
      } else {
        // If the filter is not already selected, select it.
        this.activeDateShortcut = shortcut;
        this.updateFilters({
          timeShortcut: shortcut,
        });
      }
    },
    updateEventTypeFilter(e: any) {
      if (e.locationFilterType === LocationFilterTypes.ONLY_VIRTUAL) {
        if (
          this.activeEventFilterTypeShortcut ===
          LocationFilterTypes.ONLY_VIRTUAL
        ) {
          // If the online-only filter was already selected, clear it.
          this.activeEventFilterTypeShortcut = LocationFilterTypes.NONE;
          this.updateLocalState({
            locationFilter: LocationFilterTypes.NONE,
          });
          this.updateFilters({
            locationFilter: LocationFilterTypes.NONE,
          });
        } else {
          this.activeEventFilterTypeShortcut = LocationFilterTypes.ONLY_VIRTUAL;
          this.updateLocalState({
            locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
          });
          this.updateFilters({
            locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
          });
        }
      }
      if (e.locationFilterType === LocationFilterTypes.ONLY_WITH_ADDRESS) {
        if (
          this.activeEventFilterTypeShortcut ===
            LocationFilterTypes.ONLY_WITH_ADDRESS ||
          this.activeEventFilterTypeShortcut ===
            LocationFilterTypes.WITHIN_RADIUS
        ) {
          // If an in-person filter is already selected, clear it.
          this.activeEventFilterTypeShortcut = LocationFilterTypes.NONE;
          this.updateLocalState({
            locationFilter: LocationFilterTypes.NONE,
          });
          this.updateFilters({
            locationFilter: LocationFilterTypes.NONE,
          });
        } else {
          // There are two filter types for in-person events - ONLY_WITH_ADDRESS,
          // which filters for events that have a physical address, and WITHIN_RADIUS,
          // which filters for events whose physical address is within a certain
          // radius of a reference point address.
          // Affects the values in the query sent to the back end
          if (this.filterValues.radius !== 0) {
            // If a radius is set, assume WITHIN_RADIUS should be used. Otherwise,
            // assume ONLY_WITH_ADDRESS should be used.
            this.activeEventFilterTypeShortcut =
              LocationFilterTypes.WITHIN_RADIUS;
            this.updateLocalState({
              locationFilter: LocationFilterTypes.WITHIN_RADIUS,
            });
            this.updateFilters({
              locationFilter: LocationFilterTypes.WITHIN_RADIUS,
            });
          } else {
            this.activeEventFilterTypeShortcut =
              LocationFilterTypes.ONLY_WITH_ADDRESS;
            this.updateLocalState({
              locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
            });
            this.updateFilters({
              locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
            });
          }
        }
      }
    },
  },
});
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <Tag
      v-for="shortcut in timeFilterShortcuts"
      :key="shortcut.label"
      class="align-middle"
      :data-testid="`time-shortcut-${shortcut.label}`"
      :tag="shortcut.label"
      :active="shortcut.value === filterValues.timeShortcut"
      :hide-icon="true"
      :large="false"
      @click="handleTimeFilterShortcutClick(shortcut.value)"
    />
  </div>
</template>