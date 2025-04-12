<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import GithubContributionChart from "./GithubContributionChart.vue";
import { sampleData } from '@/components/charts/sampleData'

const { theme } = useTheme();

// Track the last selected day
const selectedDay = ref(null);
const logSelected = (day) => {
  selectedDay.value = day;
  console.log("Selected day:", day);
};


</script>
<template>
  <div class="rounded-lg overflow-hidden">
    <GithubContributionChart 
      :dark-mode="theme === 'dark'"
      :data="sampleData"
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
