<script lang="ts">
import type { Ref, PropType} from "vue";
import { defineComponent, ref, computed } from "vue";
import {
  weekdays as weekdayData,
  defaultSelectedWeekdays,
} from "@/components/event/list/filters/eventSearchOptions";
import type { SelectedWeekdays, WeekdayData } from "@/types/Event";
import ResetButton from "@/components/ResetButton.vue";

export default defineComponent({
  components: {
    ResetButton,
  },
  props: {
    selectedWeekdays: {
      type: Object as PropType<SelectedWeekdays>,
      required: true,
    },
  },
  setup(props) {
    const workingCopyOfSelectedWeekdays: Ref<SelectedWeekdays> = ref(
      props.selectedWeekdays,
    );

    const flattenedWeekdays = computed(() => {
      const flattenedTimeFilters = [];

      for (const day of Object.keys(workingCopyOfSelectedWeekdays.value)) {
        if (workingCopyOfSelectedWeekdays.value[day]) {
          flattenedTimeFilters.push({
            startTimeDayOfWeek: day,
          });
        }
      }
      const res = JSON.stringify(flattenedTimeFilters);
      return res;
    });

    return {
      defaultSelectedWeekdays,
      weekdayData,
      workingCopyOfSelectedWeekdays,
      flattenedWeekdays,
    };
  },
  methods: {
    shouldBeDisabled(weekday: WeekdayData) {
      const weekdayIsSelected =
        this.workingCopyOfSelectedWeekdays[weekday.number] === true;
      return weekdayIsSelected;
    },
    shouldBeChecked(weekday: WeekdayData) {
      const weekdayIsSelected =
        this.workingCopyOfSelectedWeekdays[weekday.number] === true;

      return weekdayIsSelected;
    },
    removeWeekday(day: WeekdayData) {
      this.workingCopyOfSelectedWeekdays[day.number] = false;
    },
    addWeekday(day: WeekdayData) {
      this.workingCopyOfSelectedWeekdays[day.number] = true;
    },
    toggleSelectWeekday(day: WeekdayData) {
      if (this.workingCopyOfSelectedWeekdays[day.number]) {
        this.removeWeekday(day);
      } else {
        this.addWeekday(day);
      }
      this.$emit("updateWeekdays", this.flattenedWeekdays);
    },
    reset() {
      this.$emit("reset");

      this.workingCopyOfSelectedWeekdays = [];
    },
  },
});
</script>
<template>
  <div class="w-full">
    <div
      v-for="weekday in weekdayData"
      :key="weekday.shortName"
      class="rounded p-2"
    >
      <label :for="'weekday-' + weekday.number" class="flex items-center">
        <input
          :id="'weekday-' + weekday.number"
          type="checkbox"
          :data-testid="`weekday-${weekday.number}-checkbox`"
          class="mr-1 h-4 w-4 cursor-pointer rounded border-gray-400 text-blue-600 focus:ring-blue-500 dark:bg-gray-300"
          :checked="workingCopyOfSelectedWeekdays[weekday.number] === true"
          @input="() => toggleSelectWeekday(weekday)"
        >
        <span>{{ weekday.shortName }}</span>
      </label>
    </div>
    <ResetButton @reset="reset" />
  </div>
</template>
