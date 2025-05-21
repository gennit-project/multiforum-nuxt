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
    <div class="ml-8 flex">
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
      <div
        class="text-tiny relative w-10 pr-2"
        style="height: 104px"
      >
        <div
          v-for="(day, index) in dayLabels"
          :key="'skeleton-day-' + index"
          class="absolute flex items-center"
          :style="{ top: `${index * 14 + 3}px` }"
        >
          <div
            class="h-2 w-6 rounded opacity-70"
            :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
          />
        </div>
      </div>

      <!-- SVG grid skeleton that matches actual size -->
      <svg
        class="overflow-visible"
        height="110"
        :width="`${52 * 14 + 10}`"
      >
        <g
          v-for="week in 52"
          :key="'skeleton-week-' + week"
          :transform="`translate(${(week - 1) * 14}, 0)`"
        >
          <rect
            v-for="day in 7"
            :key="'skeleton-cell-' + week + '-' + day"
            class="rounded-sm"
            :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
            height="10"
            rx="2"
            ry="2"
            :style="{ opacity: 0.2 + Math.random() * 0.5 }"
            width="10"
            x="0"
            :y="(day - 1) * 14"
          />
        </g>
      </svg>
    </div>

    <!-- Color legend skeleton -->
    <div class="mt-4 flex items-center space-x-2 text-xs">
      <div
        class="h-3 w-8 rounded opacity-70"
        :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
      />
      <div
        v-for="level in 5"
        :key="'level-' + (level - 1)"
        class="h-3 w-3 rounded-sm"
        :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
        :style="{ opacity: 0.3 + level * 0.15 }"
      />
      <div
        class="h-3 w-8 rounded opacity-70"
        :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
      />
    </div>
  </div>
</template>
