<script setup lang="ts">
defineProps({
  darkMode: {
    type: Boolean,
    default: false,
  },
});

// Generate day labels for skeleton
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
</script>

<template>
  <div class="animate-pulse">
    <!-- Month label skeleton -->
    <div class="flex ml-8">
      <div class="relative h-6 w-full">
        <div
          v-for="i in 12"
          :key="'skeleton-month-' + i"
          class="absolute h-3 w-8 rounded text-xs"
          :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
          :style="{ left: `${i * 28}px`, opacity: 0.7 - i * 0.05 }"
        />
      </div>
    </div>

    <!-- Grid skeleton -->
    <div class="flex items-start">
      <!-- Day labels skeleton -->
      <div class="pr-2 text-tiny relative w-10" style="height: 104px;">
        <div
          v-for="(day, index) in dayLabels"
          :key="'skeleton-day-' + index"
          class="absolute flex items-center"
          :style="{top: `${index * 14 + 3}px`}"
        >
          <div
            class="w-6 h-2 rounded opacity-70"
            :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
          />
        </div>
      </div>

      <!-- SVG grid skeleton that matches actual size -->
      <svg :width="`${52 * 14 + 10}`" height="110" class="overflow-visible">
        <g
          v-for="week in 52"
          :key="'skeleton-week-' + week"
          :transform="`translate(${(week - 1) * 14}, 0)`"
        >
          <rect
            v-for="day in 7"
            :key="'skeleton-cell-' + week + '-' + day"
            x="0"
            :y="(day - 1) * 14"
            width="10"
            height="10"
            class="rounded-sm"
            :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
            :style="{ opacity: 0.2 + Math.random() * 0.5 }"
            rx="2"
            ry="2"
          />
        </g>
      </svg>
    </div>
    
    <!-- Color legend skeleton -->
    <div class="flex items-center text-xs space-x-2 mt-4">
      <div class="w-8 h-3 rounded opacity-70" :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"/>
      <div
        v-for="level in 5"
        :key="'level-' + (level - 1)"
        class="w-3 h-3 rounded-sm"
        :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
        :style="{ opacity: 0.3 + (level * 0.15) }"
      />
      <div class="w-8 h-3 rounded opacity-70" :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"/>
    </div>
  </div>
</template>