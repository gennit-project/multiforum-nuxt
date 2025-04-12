<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue';
import { Calendar } from 'lucide-vue-next';

// Define the activity type
interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

// Define the day data type
interface DayData {
  date: string; // ISO date string or date format
  count: number;
  activities: Activity[];
}

// Props definition with PropType - data is now a 2D array
const props = defineProps({
  // Data structure: 2D array where outer array = weeks, inner array = days
  data: {
    type: Array as PropType<DayData[][]>,
    required: true
  },
  // The selected year
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  // Earliest year available in the dropdown
  minYear: {
    type: Number,
    default: () => new Date().getFullYear() - 9
  },
  // Latest year available in the dropdown
  maxYear: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  // Dark mode (controlled by parent)
  darkMode: {
    type: Boolean,
    default: false
  },
  // Additional class name
  className: {
    type: String,
    default: ""
  },
  // Customizable text content
  texts: {
    type: Object,
    default: () => ({
      less: "Less",
      more: "More",
      yearLabel: "Year:",
      noContributions: "No contributions on this day",
      contributionsText: (count: number) => `${count} contribution${count !== 1 ? 's' : ''} on this day`,
      activityDetailsHeading: "Activity Details:"
    })
  }
});

// Emits
const emit = defineEmits(['day-select', 'year-select']);

interface DayInfo extends DayData {
  week: number;
  day: number;
}

const selectedDay = ref<null | DayInfo>(null);
const selectedYearValue = ref(props.year);

// Generate year range for dropdown
const availableYears = computed(() => {
  const years = [];
  for (let year = props.minYear; year <= props.maxYear; year++) {
    years.push(year);
  }
  return years;
});

// Filter data for the selected year
const chartData = computed(() => {
  // Assume the data is already organized for the right year
  // The parent component is responsible for providing the right data for the selected year
  return props.data;
});

// Generate month labels data
const monthLabels = computed(() => {
  const labels = [];
  const startDate = new Date(selectedYearValue.value, 0, 1);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Adjust to previous Sunday
  
  let currentMonth = -1; // Start with invalid month to detect first change
  
  for (let week = 0; week < 52; week++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + (week * 7));
    const month = weekDate.getMonth();
    
    // If this is a new month, add it to our labels
    if (month !== currentMonth) {
      labels.push({
        month: weekDate.toLocaleString('default', { month: 'short' }),
        position: week
      });
      currentMonth = month;
    }
  }
  
  return labels;
});

// Get color based on contribution count and theme
const getColor = (count: number) => {
  if (props.darkMode) {
    // Dark mode colors (similar to GitHub dark mode)
    if (count === 0) return '#161b22';
    if (count === 1) return '#0e4429';
    if (count === 2) return '#006d32';
    if (count === 3) return '#26a641';
    return '#39d353'; // 4 or more
  } else {
    // Light mode colors (GitHub default)
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#9be9a8';
    if (count === 2) return '#40c463';
    if (count === 3) return '#30a14e';
    return '#216e39'; // 4 or more
  }
};

// Select a day to show details
const selectDay = (weekIndex: number, dayIndex: number) => {
  const dayData = chartData.value[weekIndex][dayIndex];
  
  const dayInfo: DayInfo = {
    ...dayData,
    week: weekIndex,
    day: dayIndex
  };
  
  selectedDay.value = dayInfo;
  emit('day-select', dayInfo);
};

// Format the time from ISO string
const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

// Format the date from ISO string or date string
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
};

// Handle year changes
const handleYearChange = (newYear: number) => {
  emit('year-select', newYear);
};

// Watch for changes to selectedYearValue
watch(selectedYearValue, (newValue) => {
  if (newValue !== props.year) {
    handleYearChange(newValue);
  }
});

// Watch for changes to the year prop
watch(() => props.year, (newValue) => {
  selectedYearValue.value = newValue;
});

// Calculate total contributions for the year
const totalContributionsInYear = computed(() => {
  return chartData.value.reduce((total, week) => {
    return total + week.reduce((weekTotal, day) => weekTotal + day.count, 0);
  }, 0);
});

// Format title with current year
const formattedTitle = computed(() => {
  return `${totalContributionsInYear.value} contributions in ${selectedYearValue.value}`;
});
</script>

<template>
  <div 
    class="contribution-chart flex flex-col space-y-4 p-6 rounded-lg transition-colors duration-300"
    :class="[darkMode ? 'text-white' : 'bg-white text-gray-800', className]"
  >
    <!-- Header with title -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">{{ formattedTitle }}</h2>

      <div class="flex items-center space-x-2">
        <label for="year-select" class="text-sm font-medium">{{ texts.yearLabel }}</label>
        <select 
          id="year-select"
          v-model="selectedYearValue"
          class="p-1 border rounded text-sm w-20"
          :class="darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'"
        >
          <option 
            v-for="year in availableYears" 
            :key="year" 
            :value="year"
          >
            {{ year }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Main chart grid -->
    <div class="overflow-x-auto">
      <div class="flex flex-col">
        <!-- Month labels -->
        <div class="flex ml-8">
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
              {{ index > 0 ? label.month : '' }}
            </div>
          </div>
        </div>
        
        <div class="flex items-center">
          <!-- Day labels -->
          <div 
            class="pr-2 flex flex-col justify-around text-tiny"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          
          <!-- SVG grid -->
          <svg width="720" height="110" class="overflow-visible">
            <g 
              v-for="(week, weekIndex) in chartData" 
              :key="'week-' + weekIndex" 
              :transform="`translate(${weekIndex * 14}, 0)`"
            >
              <rect
                v-for="(dayData, dayIndex) in week" 
                :key="`day-${weekIndex}-${dayIndex}`"
                x="0"
                :y="dayIndex * 14"
                width="10"
                height="10"
                :fill="getColor(dayData.count)"
                rx="2"
                ry="2"
                :data-date="dayData.date"
                :data-count="dayData.count"
                class="cursor-pointer hover:stroke-1"
                :class="[
                  darkMode ? 'hover:stroke-gray-600' : 'hover:stroke-gray-400',
                  selectedDay && selectedDay.week === weekIndex && selectedDay.day === dayIndex ? 'stroke-2 stroke-blue-500' : ''
                ]"
                @click="selectDay(weekIndex, dayIndex)"
              >
                <title>{{ dayData.count }} contributions on {{ formatDate(dayData.date) }}</title>
              </rect>
            </g>
          </svg>
        </div>
      </div>
    </div>
    
    <!-- Color legend -->
    <div 
      class="flex items-center text-xs space-x-2"
      :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
    >
      <span>{{ texts.less }}</span>
      <div 
        v-for="level in 5" 
        :key="'level-' + (level - 1)" 
        class="w-3 h-3 rounded-sm" 
        :style="{ backgroundColor: getColor(level - 1) }"
      />
      <span>{{ texts.more }}</span>
    </div>
    
    <!-- Selected day details -->
    <div 
      v-if="selectedDay"
      class="mt-4 p-4 rounded-lg border"
      :class="darkMode ? 'border-gray-700' : 'bg-gray-50 border-gray-200'"
    >
      <div class="flex gap-3">
        <Calendar :size="20" :class="darkMode ? 'text-blue-400 mt-1' : 'text-blue-600 mt-1'" />
        <div class="w-full">
          <h3 class="font-medium">{{ formatDate(selectedDay.date) }}</h3>
          <p 
            class="text-sm"
            :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
          >
            {{ selectedDay.count === 0 
              ? texts.noContributions 
              : texts.contributionsText(selectedDay.count) 
            }}
          </p>
          
          <div v-if="selectedDay.count > 0" class="mt-2">
            <div class="text-xs font-medium uppercase tracking-wide mb-1 mt-3 text-gray-500">
              {{ texts.activityDetailsHeading }}
            </div>
            <ul 
              class="mt-1 text-sm space-y-2"
              :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
            >
              <li 
                v-for="activity in selectedDay.activities" 
                :key="activity.id"
                class="flex items-start"
              >
                <span class="mr-2">•</span>
                <div class="flex-1">
                  <div class="flex flex-col sm:flex-row sm:justify-between">
                    <div class="flex space-x-2">
                      <span class="font-medium">{{ activity.type }}</span>
                      <span> {{ activity.description }}</span>
                    </div>
                    <span class="text-xs text-gray-500 mt-1 sm:mt-0">{{ formatTime(activity.timestamp) }}</span>
                  </div>
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.text-tiny {
  font-size: 0.6rem;
}
</style>