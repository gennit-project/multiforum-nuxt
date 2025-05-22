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
        class="rounded p-2"
      >
        <label
          class="flex items-center"
          :for="'timeRange-' + range['12-hour-label']"
        >
          <input
            :id="'timeRange-' + range['12-hour-label']"
            :checked="workingCopyOfSelectedHourRanges[range['12-hour-label']]"
            class="text-orange-600 focus:ring-orange-500 mr-1 h-4 w-4 cursor-pointer rounded border-gray-400 dark:bg-gray-300"
            :data-testid="`timeRange-${range['12-hour-label']}`"
            type="checkbox"
            @input="() => toggleSelectTimeRange(range)"
          />
          <span class="ml-2 whitespace-nowrap text-sm font-medium">{{
            range["12-hour-label"]
          }}</span>
        </label>
      </div>
    </div>
    <ResetButton @reset="reset" />
  </div>
</template>
