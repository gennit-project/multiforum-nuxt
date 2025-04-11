<script setup>
import { ref, computed, watch } from 'vue';
import { Calendar } from 'lucide-vue-next';

// Props definition
const props = defineProps({
  // Data can be provided directly or generated
  data: {
    type: Array,
    default: null
  },
  // Function to fetch data for the specified year
  fetchDataForYear: {
    type: Function,
    default: null
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
      randomizeButton: "Randomize Data",
      noContributions: "No contributions on this day",
      contributionsText: (count) => `${count} contribution${count !== 1 ? 's' : ''} on this day`,
      activityDetailsHeading: "Activity Details:"
    })
  }
});

// Emits
const emit = defineEmits(['day-select', 'year-change']);

const selectedDay = ref(null);
const selectedYearValue = ref(props.year);

// Generate year range for dropdown
const availableYears = computed(() => {
  const years = [];
  for (let year = props.minYear; year <= props.maxYear; year++) {
    years.push(year);
  }
  return years;
});



// Generate dates based on the selected year
const yearDates = computed(() => {
  const dates = [];
  // Start from first Sunday of the year (or last Sunday of previous year)
  const startDate = new Date(selectedYearValue.value, 0, 1); // Jan 1 of selected year
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Adjust to previous Sunday
  
  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      dates.push(currentDate.toDateString());
    }
  }
  
  return dates;
});

// Generate data for a specific year
const generateYearData = (year) => {
  // Use year as a simple seed for pseudo-randomness
  const seed = year % 10;
  
  return Array(52).fill().map((_, weekIndex) => 
    Array(7).fill().map((_, dayIndex) => {
      // Create slightly different patterns for different years
      const base = (weekIndex + dayIndex + seed) % 5;
      return Math.floor(base * (0.7 + Math.random() * 0.6));
    })
  );
};

// The chart data, either from props or generated
const chartData = computed(() => {
  // If data prop is provided directly, use it
  if (props.data) {
    return props.data;
  }
  
  // If fetchDataForYear function is provided, use it
  if (props.fetchDataForYear) {
    return props.fetchDataForYear(selectedYearValue.value);
  }
  
  // Otherwise, generate random data
  return generateYearData(selectedYearValue.value);
});

// Get color based on contribution count and theme
const getColor = (count) => {
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
const selectDay = (weekIndex, dayIndex, count) => {
  const dayInfo = {
    week: weekIndex,
    day: dayIndex,
    date: yearDates.value[weekIndex * 7 + dayIndex],
    count: count
  };
  
  selectedDay.value = dayInfo;
  emit('day-select', dayInfo);
};

// Generate random activity type
const getActivityType = (index) => {
  const activities = [
    "Pushed to",
    "Opened a pull request in",
    "Merged a pull request in",
    "Created an issue in",
    "Reviewed a pull request in",
    "Commented on issue in",
    "Updated documentation in"
  ];
  // Use index to make it deterministic
  return activities[index % activities.length];
};

// Generate random repository name
const getRandomRepo = () => {
  const repos = [
    "project/frontend",
    "organization/api",
    "personal/website",
    "team/dashboard",
    "opensource/library",
    "company/app"
  ];
  return repos[Math.floor(Math.random() * repos.length)];
};

// Handle year changes
const handleYearChange = (newYear) => {
  emit('year-change', newYear);
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

const totalContributionsInYear = computed(() => {
    return chartData.value.reduce((total, week) => {
        return total + week.reduce((weekTotal, count) => weekTotal + count, 0);
    }, 0);
})
// Format title with current year
const formattedTitle = computed(() => {
  return `${totalContributionsInYear.value} contributions in ${selectedYearValue.value}`;
});
</script>

<template>
  <div 
    class="contribution-chart flex flex-col space-y-4 p-6 rounded-lg transition-colors duration-300"
    :class="darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'"
  >
    <!-- Header with title -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">{{ formattedTitle }}</h2>
    </div>
    
    <!-- Main chart grid -->
    <div class="overflow-x-auto">
      <div class="flex items-center">
        <!-- Day labels -->
        <div 
          class="pr-2 flex flex-col justify-around text-tiny -mt-4"
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
              v-for="(count, dayIndex) in week" 
              :key="`day-${weekIndex}-${dayIndex}`"
              x="0"
              :y="dayIndex * 14"
              width="10"
              height="10"
              :fill="getColor(count)"
              rx="2"
              ry="2"
              :data-date="yearDates[weekIndex * 7 + dayIndex]"
              :data-count="count"
              class="cursor-pointer hover:stroke-1"
              :class="[
                darkMode ? 'hover:stroke-gray-600' : 'hover:stroke-gray-400',
                selectedDay && selectedDay.week === weekIndex && selectedDay.day === dayIndex ? 'stroke-2 stroke-blue-500' : ''
              ]"
              @click="selectDay(weekIndex, dayIndex, count)"
            >
              <title>{{ count }} contributions on {{ yearDates[weekIndex * 7 + dayIndex] }}</title>
            </rect>
          </g>
        </svg>
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
    
    <!-- Controls -->
    <div class="mt-4 flex justify-center space-x-4 items-center">
      <div class="flex items-center space-x-2">
        <label for="year-select" class="text-sm font-medium">{{ texts.yearLabel }}</label>
        <select 
          id="year-select"
          v-model="selectedYearValue"
          class="p-1 border rounded text-sm"
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
    
    <!-- Selected day details -->
    <div 
      v-if="selectedDay"
      class="mt-4 p-4 rounded-lg border"
      :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'"
    >
      <div class="flex items-center gap-3">
        <Calendar :size="20" :class="darkMode ? 'text-blue-400' : 'text-blue-600'" />
        <div>
          <h3 class="font-medium">{{ selectedDay.date }}</h3>
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
              class="mt-1 text-sm space-y-1"
              :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
            >
              <li 
                v-for="i in selectedDay.count" 
                :key="'activity-' + i"
                class="flex items-start"
              >
                <span class="mr-2">•</span>
                <span>{{ getActivityType(i - 1) }} {{ getRandomRepo() }}</span>
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