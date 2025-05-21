<script lang="ts">
  import { defineComponent } from "vue";
  import LocationFilterTypes from "./filters/locationFilterTypes";

  export default defineComponent({
    name: "EventResultCount",
    props: {
      resultCount: {
        type: Number,
        required: true,
      },
      filterValues: {
        type: Object,
        required: true,
      },
    },
    setup() {
      return {
        LocationFilterTypes,
      };
    },
  });
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
    <div
      v-else
      class="bold flex flex-wrap items-center space-x-2"
    >
      <div class="inline-block">{{ resultCount }} results</div>
    </div>
  </div>
</template>
