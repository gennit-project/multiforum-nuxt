<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import GithubContributionChart from "./GithubContributionChart.vue";

const { theme } = useTheme();

// Track the last selected day
const selectedDay = ref(null);
const logSelected = (day) => {
  selectedDay.value = day;
  console.log("Selected day:", day);
};

// Generate custom data (higher activity pattern)
const customData = ref(
  Array(52)
    .fill()
    .map((_, weekIndex) =>
      Array(7)
        .fill()
        .map((_, dayIndex) => {
          // Create a pattern with higher activity mid-week
          const dayFactor = Math.abs(dayIndex - 3) < 2 ? 0.8 : 0.3;
          const weekFactor = Math.sin(weekIndex / 10) * 0.5 + 0.5;
          return Math.floor(dayFactor * weekFactor * 5);
        })
    )
);
</script>
<template>
  <div class="rounded-lg overflow-hidden">
    <GithubContributionChart 
      :dark-mode="theme === 'dark'"
      :data="customData"
      @day-select="logSelected" 
    />
  </div>
</template>
<style>
body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}
</style>
