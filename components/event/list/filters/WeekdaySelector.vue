<script setup lang="ts">
  import { ref, computed } from "vue";
  import type { PropType } from "vue";
  import {
    weekdays as weekdayData,
    defaultSelectedWeekdays,
  } from "@/components/event/list/filters/eventSearchOptions";
  import type { SelectedWeekdays, WeekdayData } from "@/types/Event";
  import ResetButton from "@/components/ResetButton.vue";

  const props = defineProps({
    selectedWeekdays: {
      type: Object as PropType<SelectedWeekdays>,
      required: true,
    },
  });

  const emit = defineEmits(["updateWeekdays", "reset"]);

  const workingCopyOfSelectedWeekdays = ref({ ...props.selectedWeekdays });

  const flattenedWeekdays = computed(() => {
    const flattenedTimeFilters = [];
    for (const day of Object.keys(workingCopyOfSelectedWeekdays.value)) {
      if (workingCopyOfSelectedWeekdays.value[day]) {
        flattenedTimeFilters.push({
          startTimeDayOfWeek: day,
        });
      }
    }
    return JSON.stringify(flattenedTimeFilters);
  });

  const toggleSelectWeekday = (day: WeekdayData) => {
    if (workingCopyOfSelectedWeekdays.value[day.number]) {
      removeWeekday(day);
    } else {
      addWeekday(day);
    }
    emit("updateWeekdays", flattenedWeekdays.value);
  };

  const removeWeekday = (day: WeekdayData) => {
    workingCopyOfSelectedWeekdays.value[day.number] = false;
  };

  const addWeekday = (day: WeekdayData) => {
    workingCopyOfSelectedWeekdays.value[day.number] = true;
  };

  const reset = () => {
    emit("reset");
    workingCopyOfSelectedWeekdays.value = { ...defaultSelectedWeekdays };
  };
</script>

<template>
  <div class="w-full">
    <div
      v-for="weekday in weekdayData"
      :key="weekday.shortName"
      class="rounded p-2"
    >
      <label
        class="flex items-center"
        :for="'weekday-' + weekday.number"
      >
        <input
          :id="'weekday-' + weekday.number"
          :checked="workingCopyOfSelectedWeekdays[weekday.number] === true"
          class="text-orange-600 focus:ring-orange-500 mr-1 h-4 w-4 cursor-pointer rounded border-gray-400 dark:bg-gray-300"
          :data-testid="`weekday-${weekday.number}-checkbox`"
          type="checkbox"
          @input="() => toggleSelectWeekday(weekday)"
        />
        <span>{{ weekday.shortName }}</span>
      </label>
    </div>
    <ResetButton @reset="reset" />
  </div>
</template>
