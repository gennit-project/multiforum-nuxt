<script setup lang="ts">
import { LocationFilterTypes } from './filters/locationFilterTypes';

interface FilterValues {
  locationFilter?: LocationFilterTypes;
}

defineProps<{
  resultCount: number;
  filterValues: FilterValues;
}>();
</script>

<template>
  <div class="block px-4">
    <div
      v-if="filterValues.locationFilter === LocationFilterTypes.ONLY_VIRTUAL"
      class="bold flex flex-wrap items-center space-x-2"
    >
      {{ resultCount }} results
    </div>
    <div
      v-else-if="filterValues.locationFilter === LocationFilterTypes.NONE"
      class="bold flex flex-wrap items-center space-x-2"
    >
      {{ resultCount }} results
    </div>
    <div v-else class="bold flex flex-wrap items-center space-x-2">
      <div class="inline-block">{{ resultCount }} results</div>
    </div>
  </div>
</template>
