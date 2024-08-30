<script lang="ts">
import type { Ref, PropType } from "vue";
import { defineComponent, ref } from "vue";
import {
  weekdays as weekdayData,
  hourRangesData,
  defaultSelectedWeekdays,
  defaultSelectedHourRanges,
  defaultSelectedWeeklyHourRanges,
  createDefaultSelectedHourRanges,
} from "@/components/event/list/filters/eventSearchOptions";
import type {
  SelectedHourRanges,
  WeekdayData,
  HourRangeData,
} from "@/types/Event";
import ResetButton from "@/components/ResetButton.vue";


export default defineComponent({
  components: {
    ResetButton
  },
  props: {
    selectedHourRanges: {
      type: Object as PropType<SelectedHourRanges>,
      required: true,
    },
  },
  setup(props) {
    const workingCopyOfSelectedHourRanges: Ref<SelectedHourRanges> = ref(
      props.selectedHourRanges
    );

    // take defaults from params
    return {
      defaultSelectedWeekdays,
      defaultSelectedHourRanges,
      defaultSelectedWeeklyHourRanges,
      hourRangesData,
      weekdayData,
      workingCopyOfSelectedHourRanges,
    };
  },
  methods: {
    shouldBeDisabled(weekday: WeekdayData, range: HourRangeData) {
      const hourRangeIsSelected =
        this.workingCopyOfSelectedHourRanges[range["12-hour-label"]] === true;
      return hourRangeIsSelected;
    },
    shouldBeChecked(weekday: WeekdayData, range: HourRangeData) {
      const hourRangeIsSelected =
        this.workingCopyOfSelectedHourRanges[range["12-hour-label"]] === true;

      return hourRangeIsSelected;
    },
    toggleSelectTimeRange(timeRange: HourRangeData) {
      // This function makes it so that when an
      // entire time range range row is selected with
      // a checkbox in the form for selecting
      // availability windows, it applies to the
      // time range filter.
      const label = timeRange["12-hour-label"];
      if (this.workingCopyOfSelectedHourRanges[label]) {
        this.removeTimeRange(timeRange);
      } else {
        this.addTimeRange(timeRange);
      }
      this.$emit("updateHourRanges", this.flattenHourRanges());
    },
    flattenHourRanges() {
      const flattenedTimeFilters = [];
      for (const timeSlot in this.workingCopyOfSelectedHourRanges) {
        if (this.workingCopyOfSelectedHourRanges[timeSlot]) {
          flattenedTimeFilters.push({
            startTimeHourOfDay: timeSlot,
          });
        }
      }
      const res = JSON.stringify(flattenedTimeFilters);
      return res;
    },
    resetTimeSlots() {
      this.workingCopyOfSelectedHourRanges = createDefaultSelectedHourRanges();
      this.$emit("resetTimeSlots");
    },
    removeTimeRange(timeRange: HourRangeData) {
      const label = timeRange["12-hour-label"];
      this.workingCopyOfSelectedHourRanges[label] = false;
      for (const weekday in this.workingCopyOfTimeSlots) {
        // Leave the input enabled if it was locked in place
        // by highlighting the same time slot for the whole week.
        if (!(this.workingCopyOfSelectedWeekdays[weekday] === true)) {
          this.workingCopyOfTimeSlots[weekday][label] = false;
        }
      }
      // Don't need to emit an event to update params because it is
      // already emitted in toggleSelectTimeRange
    },
    addTimeRange(timeRange: HourRangeData) {
      const label = timeRange["12-hour-label"];
      this.workingCopyOfSelectedHourRanges[label] = true;
      for (const weekday in this.workingCopyOfTimeSlots) {
        this.workingCopyOfTimeSlots[weekday][label] = true;
      }
      // Don't need to emit an event to update params because it is
      // already emitted in toggleSelectTimeRange
    },
    reset(){
      this.$emit('reset')

      this.workingCopyOfSelectedHourRanges = {}
    }
  },
});
</script>
<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="range in hourRangesData"
        :key="range['12-hour-label']"
        class="p-2 rounded"
      >
        <label
          :for="'timeRange-' + range['12-hour-label']"
          class="flex items-center"
        >
          <input
            :id="'timeRange-' + range['12-hour-label']"
            type="checkbox"
            :data-testid="`timeRange-${range['12-hour-label']}`"
            class="cursor-pointer text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded dark:bg-gray-300"
            :checked="workingCopyOfSelectedHourRanges[range['12-hour-label']]"
            @input="() => toggleSelectTimeRange(range)"
          >
          <span class="ml-2 text-sm font-medium whitespace-nowrap">{{ range["12-hour-label"] }}</span>
        </label>
      </div>
    </div>
    <ResetButton @reset="reset" />
  </div>
</template>
