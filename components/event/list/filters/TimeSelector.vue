<script setup lang="ts">
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { hourRangesData } from "@/components/event/list/filters/eventSearchOptions";
import type { SelectedHourRanges, HourRangeData } from "@/types/Event";
import ResetButton from "@/components/ResetButton.vue";

const props = defineProps({
  selectedHourRanges: {
    type: Object as PropType<SelectedHourRanges>,
    required: true,
  },
});

const emit = defineEmits(["updateHourRanges", "resetTimeSlots", "reset"]);

const workingCopyOfSelectedHourRanges = ref({ ...props.selectedHourRanges });

const toggleSelectTimeRange = (timeRange: HourRangeData) => {
  const label = timeRange["12-hour-label"];
  if (workingCopyOfSelectedHourRanges.value[label]) {
    removeTimeRange(timeRange);
  } else {
    addTimeRange(timeRange);
  }
  emit("updateHourRanges", flattenHourRanges());
};

const flattenHourRanges = () => {
  const flattenedTimeFilters: any[] = [];
  for (const timeSlot in workingCopyOfSelectedHourRanges.value) {
    if (workingCopyOfSelectedHourRanges.value[timeSlot]) {
      flattenedTimeFilters.push({
        startTimeHourOfDay: timeSlot,
      });
    }
  }
  return JSON.stringify(flattenedTimeFilters);
};
const removeTimeRange = (timeRange: HourRangeData) => {
  const label = timeRange["12-hour-label"];
  workingCopyOfSelectedHourRanges.value[label] = false;
};

const addTimeRange = (timeRange: HourRangeData) => {
  const label = timeRange["12-hour-label"];
  workingCopyOfSelectedHourRanges.value[label] = true;
};

const reset = () => {
  emit("reset");
  workingCopyOfSelectedHourRanges.value = {};
};

const hourRangesDataComputed = computed(() => hourRangesData);
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="range in hourRangesDataComputed"
        :key="range['12-hour-label']"
        class="p-2 rounded"
      >
        <label
          :for="'timeRange-' + range['12-hour-label']"
          class="flex items-center"
        >
          <input
            :id="'timeRange-' + range['12-hour-label']"
<<<<<<< HEAD
            :checked="workingCopyOfSelectedHourRanges[range['12-hour-label']]"
            class="mr-1 h-4 w-4 cursor-pointer rounded border-gray-400 text-orange-600 focus:ring-orange-500 dark:bg-gray-300"
            :data-testid="`timeRange-${range['12-hour-label']}`"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            type="checkbox"
            :data-testid="`timeRange-${range['12-hour-label']}`"
            class="cursor-pointer text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded dark:bg-gray-300"
            :checked="workingCopyOfSelectedHourRanges[range['12-hour-label']]"
            @input="() => toggleSelectTimeRange(range)"
          >
<<<<<<< HEAD
          <span class="ml-2 whitespace-nowrap text-sm font-medium">{{
=======
          <span class="ml-2 text-sm font-medium whitespace-nowrap">{{
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            range["12-hour-label"]
          }}</span>
        </label>
      </div>
    </div>
    <ResetButton @reset="reset" />
  </div>
</template>
