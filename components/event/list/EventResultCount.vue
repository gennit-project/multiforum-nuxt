
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
    setup(){
        return {
            LocationFilterTypes,
        }
    }
})

</script>

<template>
  <div class="px-4 block">
    <div
      v-if="
        filterValues.locationFilter === LocationFilterTypes.ONLY_VIRTUAL
      "
      class="items-center space-x-2 flex flex-wrap bold"
    >
      {{ resultCount }} results
    </div>
    <div
      v-else-if="filterValues.locationFilter === LocationFilterTypes.NONE"
      class="items-center space-x-2 flex flex-wrap bold"
    >
      {{ resultCount }} results
    </div>
    <div
      v-else
      class="items-center space-x-2 flex flex-wrap bold"
    >
      <div class="inline-block">
        {{ resultCount }} results
      </div>
    </div>
  </div>
</template>