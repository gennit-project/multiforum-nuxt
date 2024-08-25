<script lang="ts">
import { defineComponent, computed, ref, Ref } from "vue";
import { useRoute } from "vue-router";
import LocationFilterTypes from "./locationFilterTypes";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import { SearchEventValues } from "@/types/Event";
import Tag from "@/components/Tag.vue";
import { capitalizeCase } from "@/components/comments/getSortFromQuery";

export default defineComponent({
  name: "OnlineInPersonShortcuts",
  components: {
    Tag,
  },
  setup() {
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
      }),
    );

    const activeShortcut = ref(route.query.locationFilter);

    return {
      channelId,
      activeShortcut,
      filterValues,
      LocationFilterTypes: LocationFilterTypes,
      route,
      shortcuts: LocationFilterTypes,
    };
  },
  created() {
    this.$watch("$route.query", () => {
      if (this.route.query) {
        this.filterValues = getFilterValuesFromParams({
          route: this.route,
          channelId: this.channelId,
        });
      }
    });
  },
  methods: {
    removeLocationFilter () {
      this.activeShortcut = null;
      const query = Object.assign({}, this.$route.query);
      delete query.locationFilter

      this.$router.replace({
        query: {
          ...query,
        },
      });
      this.updateFilters({
        locationFilter: null,
      });
    },
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
    handleShortcutClick(shortcut: string) {
      if (shortcut === this.activeShortcut) {
        // If the filter is currently selected, clear it.
        this.removeLocationFilter()
      } else {
        // If the filter is not already selected, select it.
        this.activeShortcut = shortcut;
        this.updateFilters({
          locationFilter: shortcut,
        });
      }
    },
    formatLabel (shortcut: string) {
      return capitalizeCase(shortcut.split("_").join(" "));
    },
  },
});
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <Tag
      :key="LocationFilterTypes.ONLY_VIRTUAL"
      class="align-middle"
      :data-testid="`time-shortcut-${LocationFilterTypes.ONLY_VIRTUAL}`"
      :tag="formatLabel(LocationFilterTypes.ONLY_VIRTUAL)"
      :active="activeShortcut === LocationFilterTypes.ONLY_VIRTUAL"
      :hide-icon="true"
      :large="false"
      @click="handleShortcutClick(LocationFilterTypes.ONLY_VIRTUAL)"
    />
    <Tag
      :key="LocationFilterTypes.ONLY_WITH_ADDRESS"
      class="align-middle"
      :data-testid="`time-shortcut-${LocationFilterTypes.ONLY_WITH_ADDRESS}`"
      :tag="formatLabel(LocationFilterTypes.ONLY_WITH_ADDRESS)"
      :active="activeShortcut === LocationFilterTypes.ONLY_WITH_ADDRESS"
      :hide-icon="true"
      :large="false"
      @click="handleShortcutClick(LocationFilterTypes.ONLY_WITH_ADDRESS)"
    />
  </div>
</template>
