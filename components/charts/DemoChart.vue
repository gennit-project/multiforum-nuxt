<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import GithubContributionChart from "./GithubContributionChart.vue";
import { GET_USER_CONTRIBUTIONS } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";

const { theme } = useTheme();
const route = useRoute();
const username = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});
const year = ref(new Date().getFullYear());

const { result: contributionsResult, loading } = useQuery(
  GET_USER_CONTRIBUTIONS,
  {
    username: username,
    year: year,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const contributions = computed(() => {
  if (contributionsResult.value?.getUserContributions) {
    // Get the raw data from the API
    const rawData = contributionsResult.value.getUserContributions;
    
    // Process the data to ensure compatibility with the chart component
    return rawData.map(week => {
      if (!week) return [];
      
      return week.map(day => {
        if (!day) return null;
        
        // Set the count based on activities length if count is 0 but has activities
        const dayCount = day.count || 0;
        const activitiesCount = day.activities?.length || 0;
        const finalCount = dayCount > 0 ? dayCount : activitiesCount;
        
        return {
          date: day.date,
          count: finalCount,
          activities: day.activities || []
        };
      });
    });
  }
  return [];
});

// Track the last selected day
const selectedDay = ref(null);
const logSelected = (day: any) => {
  selectedDay.value = day;
  console.log("Selected day:", day);
};

const setYear = (newYear: number) => {
  year.value = newYear;
  console.log("Selected year:", newYear);
};

</script>
<template>
  <div class="rounded-lg overflow-hidden">
    <GithubContributionChart 
      :dark-mode="theme === 'dark'"
      :data="contributions"
      :loading="loading"
      :year="year"
      @day-select="logSelected"
      @year-select="setYear"
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
