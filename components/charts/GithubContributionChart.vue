<script setup lang="ts">
  import { ref, computed, watch, type PropType, nextTick } from "vue";
  import type {
    Comment as CommentType,
    Discussion as DiscussionType,
    Event as EventType,
  } from "@/__generated__/graphql";
  import { Calendar } from "lucide-vue-next";
  import CommentComponent from "@/components/comments/Comment.vue";
  import DiscussionItemInProfile from "@/components/user/DiscussionItemInProfile.vue";
  import EventListItemInProfile from "@/components/user/EventItemInProfile.vue";
  import ContributionChartSkeleton from "./ContributionChartSkeleton.vue";

  // Define the activity type
  interface Activity {
    id: string;
    type: string;
    description: string;
    Comments?: CommentType[];
    Discussions?: DiscussionType[];
    Events?: EventType[];
  }

  // Define the day data type
  interface DayData {
    date: string; // ISO date string or date format
    count: number;
    activities: Activity[];
  }

  // Props definition with sparse data input
  const props = defineProps({
    // Data structure: sparse array of activity data
    contributionData: {
      type: Array as PropType<DayData[]>,
      required: true,
    },
    // Loading state
    loading: {
      type: Boolean,
      default: false,
    },
    // The selected year
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    // Earliest year available in the dropdown
    minYear: {
      type: Number,
      default: () => new Date().getFullYear() - 3,
    },
    // Latest year available in the dropdown
    maxYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    // Dark mode (controlled by parent)
    darkMode: {
      type: Boolean,
      default: false,
    },
    // Additional class name
    className: {
      type: String,
      default: "",
    },
    // Customizable text content
    texts: {
      type: Object,
      default: () => ({
        less: "Less",
        more: "More",
        yearLabel: "Year:",
        noContributions: "No contributions on this day",
        contributionsText: (count: number) =>
          `${count} contribution${count !== 1 ? "s" : ""} on this day`,
        activityDetailsHeading: "Activity Details",
        loading: "Loading activity data...",
      }),
    },
  });

  // Emits
  const emit = defineEmits(["day-select", "year-select"]);

  interface DayInfo extends DayData {
    week: number;
    day: number;
  }

  const selectedDay = ref<null | DayInfo>(null);
  const selectedYearValue = ref(props.year);
  const gridData = ref<DayData[][]>([]);

  // Transform sparse contribution data into grid structure
  const buildGridDataFromContributions = () => {
    // Create a map of date -> activity data for quick lookup
    const activityMap: Record<string, DayData> = {};

    // Check if contributionData exists before iterating
    if (props.contributionData && Array.isArray(props.contributionData)) {
      props.contributionData.forEach((day) => {
        activityMap[day.date] = day;
      });
    }

    // Generate the complete grid structure for the year
    const year = selectedYearValue.value;
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    // Get the first Sunday of the grid
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // Get the last Saturday of the grid
    const endDate = new Date(lastDay);
    const daysToAdd = 6 - lastDay.getDay();
    endDate.setDate(lastDay.getDate() + daysToAdd);

    // Build the grid week by week
    const grid: DayData[][] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const week: DayData[] = [];

      // Add 7 days (a full week)
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split("T")[0];

        // Check if we have activity data for this day
        if (activityMap[dateStr]) {
          week.push(activityMap[dateStr]);
        } else {
          // Create an empty day entry
          week.push({
            date: dateStr,
            count: 0,
            activities: [],
          });
        }

        // Move to next day
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        currentDate = nextDate;
      }

      grid.push(week);
    }

    return grid;
  };

  // Update grid when year or contribution data changes
  watch(
    [() => props.contributionData, selectedYearValue],
    () => {
      gridData.value = buildGridDataFromContributions();
    },
    { immediate: true }
  );

  // Generate year range for dropdown
  const availableYears = computed(() => {
    const years = [];
    for (let year = props.minYear; year <= props.maxYear; year++) {
      years.push(year);
    }
    return years;
  });

  // Generate month labels data with improved calculation
  const monthLabels = computed(() => {
    const labels = [];

    // Only process if we have data
    if (!gridData.value || gridData.value.length === 0) {
      return labels;
    }

    // Track the months we've already added
    const addedMonths = new Set();

    // Iterate through all weeks in the data
    gridData.value.forEach((week, weekIndex) => {
      // Skip empty weeks
      if (!week || week.length === 0) return;

      // Get the first day with a valid date in the week
      const dayWithDate = week.find((day) => day && day.date);
      if (!dayWithDate) return;

      try {
        const date = new Date(dayWithDate.date);
        const monthName = date.toLocaleString("default", { month: "short" });

        // Only add a new label if we haven't seen this month yet
        if (!addedMonths.has(monthName)) {
          addedMonths.add(monthName);
          labels.push({
            month: monthName,
            position: weekIndex,
          });
        }
      } catch (e) {
        console.error("Error parsing date", e);
      }
    });

    return labels;
  });

  // Get day of the week labels
  const dayLabels = computed(() => {
    return ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  });

  // Use computed for colors to ensure reactivity
  const getColorScheme = computed(() => {
    if (props.darkMode) {
      // Dark mode colors (similar to GitHub dark mode)
      return {
        0: "#161b22",
        1: "#0e4429",
        2: "#006d32",
        3: "#26a641",
        4: "#39d353", // 4 or more
      };
    } else {
      // Light mode colors (GitHub default)
      return {
        0: "#ebedf0",
        1: "#9be9a8",
        2: "#40c463",
        3: "#30a14e",
        4: "#216e39", // 4 or more
      };
    }
  });

  // Get color based on contribution count and theme
  const getColor = (count: number) => {
    const colors = getColorScheme.value;
    const level = Math.min(count, 4);
    return colors[level];
  };

  // Select a day to show details
  const selectDay = (weekIndex: number, dayIndex: number) => {
    if (!gridData.value[weekIndex] || !gridData.value[weekIndex][dayIndex]) return;

    const dayData = gridData.value[weekIndex][dayIndex];

    const dayInfo: DayInfo = {
      ...dayData,
      week: weekIndex,
      day: dayIndex,
    };

    // If current day info is the same as the previous, set selected day to null
    if (
      selectedDay.value &&
      selectedDay.value.week === weekIndex &&
      selectedDay.value.day === dayIndex
    ) {
      selectedDay.value = null;
      emit("day-select", null);
      return;
    }

    selectedDay.value = dayInfo;
    emit("day-select", dayInfo);
  };

  // Format the date from ISO string or date string
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Handle year changes
  const handleYearChange = (newYear: number) => {
    emit("year-select", newYear);
  };

  // Watch for changes to selectedYearValue
  watch(selectedYearValue, (newValue) => {
    if (newValue !== props.year) {
      handleYearChange(newValue);
    }
  });

  // Watch for changes to the year prop
  watch(
    () => props.year,
    (newValue) => {
      selectedYearValue.value = newValue;
    }
  );

  // Watch for theme changes and force a re-render of the chart cells
  const chartKey = ref(0);
  watch(
    () => props.darkMode,
    () => {
      // Increment the key to force a component re-render
      nextTick(() => {
        chartKey.value++;
      });
    }
  );

  // Calculate total contributions for the year
  const totalContributionsInYear = computed(() => {
    if (!gridData.value) return 0;

    return gridData.value.reduce((total, week) => {
      if (!week) return total;
      return (
        total +
        week.reduce((weekTotal, day) => {
          if (!day) return weekTotal;
          return weekTotal + day.count;
        }, 0)
      );
    }, 0);
  });

  // Format title with current year
  const formattedTitle = computed(() => {
    return `${totalContributionsInYear.value} contributions in ${selectedYearValue.value}`;
  });

  // Validate and get cell count to ensure proper rendering
  const cellCount = computed(() => {
    if (!gridData.value) return 0;
    return gridData.value.length;
  });
</script>

<template>
  <div
    class="contribution-chart mb-4 flex flex-col space-y-4 rounded-lg px-4 transition-colors duration-300"
    :class="[darkMode ? 'text-white' : 'bg-white text-gray-800', className]"
  >
    <!-- Header with title -->
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-xl">{{ formattedTitle }}</h2>

      <div class="flex items-center space-x-2">
        <label
          class="text-sm font-medium"
          for="year-select"
          >{{ texts.yearLabel }}</label
        >
        <select
          id="year-select"
          v-model="selectedYearValue"
          class="w-20 rounded border p-1 text-sm"
          :class="
            darkMode
              ? 'border-gray-600 bg-gray-800 text-white'
              : 'border-gray-500 bg-white text-gray-800'
          "
        >
          <option
            v-for="y in availableYears"
            :key="y"
            :value="y"
          >
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <!-- Main chart grid -->
    <div class="overflow-x-auto">
      <!-- Loading state is handled within the component -->
      <div v-if="loading">
        <ContributionChartSkeleton :dark-mode="darkMode" />
      </div>

      <!-- Actual chart (when not loading) -->
      <div
        v-else
        class="flex flex-col"
      >
        <!-- Month labels (improved positioning) -->
        <div class="ml-8 flex">
          <div
            class="relative h-6 w-full"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            <div
              v-for="(label, index) in monthLabels"
              :key="'month-' + index"
              class="absolute text-xs font-medium"
              :style="{ left: `${label.position * 14}px` }"
            >
              <span v-if="index > 0">{{ label.month }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-start space-x-6">
          <!-- Day labels (properly spaced) -->
          <div
            class="text-tiny relative w-10"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
            style="height: 104px"
          >
            <span
              v-for="(day, index) in dayLabels"
              :key="'day-label-' + index"
              class="absolute flex items-center"
              :style="{ top: `${index * 14 + 3}px` }"
            >
              {{ day }}
            </span>
          </div>
          <div class="flex-1">
            <svg
              :key="chartKey"
              class="overflow-visible"
              height="110"
              :width="`${cellCount * 14 + 10}`"
            >
              <g
                v-for="(week, weekIndex) in gridData"
                :key="'week-' + weekIndex"
                :transform="`translate(${weekIndex * 14}, 0)`"
              >
                <rect
                  v-for="(dayData, dayIndex) in week"
                  :key="`day-${weekIndex}-${dayIndex}`"
                  class="cursor-pointer transition-colors duration-200 hover:stroke-1"
                  :class="[
                    darkMode ? 'hover:stroke-green-600' : 'hover:stroke-green-400',
                    selectedDay && selectedDay.week === weekIndex && selectedDay.day === dayIndex
                      ? 'stroke-orange-500 stroke-2'
                      : '',
                  ]"
                  :data-count="dayData.count"
                  :data-date="dayData.date"
                  :fill="getColor(dayData.count)"
                  height="10"
                  rx="2"
                  ry="2"
                  width="10"
                  x="0"
                  :y="dayIndex * 14"
                  @click="selectDay(weekIndex, dayIndex)"
                >
                  <title>
                    {{ dayData.count }} contributions on
                    {{ formatDate(dayData.date) }}
                  </title>
                </rect>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Color legend -->
    <div
      class="flex items-center space-x-2 text-xs"
      :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
    >
      <span>{{ texts.less }}</span>
      <div
        v-for="level in 5"
        :key="'level-' + (level - 1)"
        class="h-3 w-3 rounded-sm transition-colors duration-200"
        :style="{ backgroundColor: getColor(level - 1) }"
      />
      <span>{{ texts.more }}</span>
    </div>

    <!-- Selected day details -->
    <div
      v-if="selectedDay"
      class="mt-4 rounded-lg border p-4"
      :class="darkMode ? 'border-green-500' : 'bg-gray-50 border-orange-500'"
    >
      <div class="flex gap-3">
        <Calendar
          :class="darkMode ? 'mt-1 text-green-400' : 'mt-1 text-green-500'"
          :size="20"
        />
        <div class="w-full">
          <h3 class="font-medium">{{ formatDate(selectedDay.date) }}</h3>
          <p
            class="text-sm"
            :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            <template v-if="selectedDay.count === 0">
              {{ texts.noContributions }}
            </template>
            <template v-else>
              <template
                v-for="(activity, idx) in selectedDay.activities"
                :key="activity.id"
              >
                <template v-if="activity.Comments && activity.Comments.length > 0">
                  {{ activity.Comments.length }}
                  {{ activity.Comments.length === 1 ? "comment" : "comments" }}
                </template>
                <template v-if="activity.Discussions && activity.Discussions.length > 0">
                  <template v-if="activity.Comments && activity.Comments.length > 0">•</template>
                  {{ activity.Discussions.length }}
                  {{ activity.Discussions.length === 1 ? "discussion " : "discussions " }}
                </template>
                <template v-if="activity.Events && activity.Events.length > 0">
                  <template
                    v-if="
                      (activity.Comments && activity.Comments.length > 0) ||
                      (activity.Discussions && activity.Discussions.length > 0)
                    "
                    >•</template
                  >
                  {{ activity.Events.length }}
                  {{ activity.Events.length === 1 ? "event" : "events" }}
                </template>
                <template v-if="idx < selectedDay.activities.length - 1"> and </template>
              </template>
              on this day
            </template>
          </p>

          <div
            v-if="selectedDay.count > 0"
            class="mt-2"
          >
            <div
              class="mb-1 mt-3 text-xs font-medium uppercase tracking-wide"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              {{ texts.activityDetailsHeading }}
            </div>
            <ul
              class="mt-1 list-none space-y-2 text-sm"
              :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              <li
                v-for="activity in selectedDay.activities"
                :key="activity.id"
                class="list-none flex-col items-start"
              >
                <div class="flex-1">
                  <div class="flex flex-col sm:flex-row sm:justify-between">
                    <div class="flex space-x-2">
                      <span class="font-medium">{{ activity.type }}</span>
                      <span> {{ activity.description }}</span>
                    </div>
                  </div>
                </div>
                <!-- Comments Section -->
                <div
                  v-if="activity.Comments && activity.Comments.length > 0"
                  class="mt-2"
                >
                  <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Comments
                  </h4>
                  <div
                    v-for="comment in activity.Comments"
                    :key="comment.id"
                    class="space-y-4"
                  >
                    <CommentComponent
                      v-if="!comment.archived"
                      :comment-data="comment"
                      :depth="0"
                      :go-to-permalink-on-click="true"
                      :parent-comment-id="comment.ParentComment ? comment.ParentComment.id : ''"
                      :show-channel="true"
                      :show-context-link="true"
                    />
                    <!-- <ArchivedCommentText 
                        v-if="comment?.archived"
                        :channel-id="comment.Channel?.id"
                        :comment-id="comment.id"
                      /> -->
                  </div>
                </div>

                <!-- Discussions Section -->
                <div
                  v-if="activity.Discussions && activity.Discussions.length > 0"
                  class="py-2"
                >
                  <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discussions
                  </h4>
                  <DiscussionItemInProfile
                    v-for="discussion in activity.Discussions"
                    :key="discussion.id"
                    class="mb-1 flex-col gap-2"
                    :discussion="discussion"
                  />
                </div>

                <!-- Events Section -->
                <div
                  v-if="activity.Events && activity.Events.length > 0"
                  class="py-2"
                >
                  <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Events</h4>
                  <EventListItemInProfile
                    v-for="event in activity.Events"
                    :key="event.id"
                    class="mb-1 flex-col gap-2"
                    :current-channel-id="''"
                    :event="event"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .contribution-chart {
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .text-tiny {
    font-size: 0.6rem;
  }
  .h-110 {
    height: 110px;
  }
</style>
