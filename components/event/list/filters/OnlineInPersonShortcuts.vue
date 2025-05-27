<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "nuxt/app";
import LocationFilterTypes from "./locationFilterTypes";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getEventFilterValuesFromParams";
import type { SearchEventValues } from "@/types/Event";
import Tag from "@/components/TagComponent.vue";
import { capitalizeCase } from "@/components/comments/getSortFromQuery";

// Setup function
const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const filterValues = ref<SearchEventValues>(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
  })
);

const activeShortcut = ref(route.query.locationFilter);

const handleShortcutClick = (shortcut: string) => {
  if (shortcut === activeShortcut.value) {
    removeLocationFilter();
  } else {
    activeShortcut.value = shortcut;
    updateFilters({ locationFilter: shortcut });
  }
};

const removeLocationFilter = () => {
  activeShortcut.value = null;
  const query = { ...route.query };
  delete query.locationFilter;

  router.replace({ query });
  updateFilters({ locationFilter: undefined });
};

const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  router.replace({
    // @ts-ignore
    query: {
      ...existingQuery,
      ...params,
    },
  });
};

const formatLabel = (shortcut: string) => {
  return capitalizeCase(shortcut.split("_").join(" "));
};

// Watcher to update filters on query change
watch(
  () => route.query,
  () => {
    filterValues.value = getFilterValuesFromParams({
      route,
      channelId: channelId.value,
    });
  },
  { immediate: true }
);
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
