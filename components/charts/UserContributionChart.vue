<script setup lang="ts">
import { ref, computed } from "vue";
import { useUIStore } from "@/stores/uiStore";
import GithubContributionChart from "./GithubContributionChart.vue";
import ContributionChartSkeleton from "./ContributionChartSkeleton.vue";
import { GET_USER_CONTRIBUTIONS, GET_USER } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";

// Get the theme from UI store
const uiStore = useUIStore();
const isDarkMode = computed(() => uiStore.theme === "dark");
const route = useRoute();
const username = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});

// Year for the backend query (null by default)
const queryYear = ref<number | null>(null);

// Year for display in the title (current year by default)
const displayYear = ref(new Date().getFullYear());

// Get user info to determine account age
const { result: userResult } = useQuery(
  GET_USER,
  {
    username: username,
  },
  {
    fetchPolicy: "cache-first",
  }
);

// Calculate minYear based on user's account creation date
const minYear = computed(() => {
  if (userResult.value?.users?.[0]?.createdAt) {
    const createdAt = new Date(userResult.value.users[0].createdAt);
    return createdAt.getFullYear();
  }
  return new Date().getFullYear() - 3; // Default to 3 years ago if no data
});

const { result: contributionsResult, loading } = useQuery(
  GET_USER_CONTRIBUTIONS,
  {
    username: username,
    year: queryYear,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const contributions = computed(() => {
  try {
    if (contributionsResult.value?.getUserContributions) {
      // Get the raw data from the API - this is now a flat array of day data
      const rawData = contributionsResult.value.getUserContributions;
      
      // Make sure rawData is an array
      if (!Array.isArray(rawData)) {
        console.error('Expected getUserContributions to be an array, got:', typeof rawData);
        return [];
      }
      
      // Process the data to ensure compatibility with the chart component
      return rawData.map((day) => {
        if (!day) return null;

        // Calculate count - use provided count or derive from activities
        const dayCount = day.count || 0;
        const activitiesCount = day.activities?.length || 0;
        const finalCount = dayCount > 0 ? dayCount : activitiesCount;

        return {
          date: day.date,
          count: finalCount,
          activities: day.activities || [],
        };
      }).filter((day) => day !== null); // Filter out null values
    }
  } catch (error) {
    console.error('Error processing contribution data:', error);
  }
  return [];
});

// Track the last selected day
const selectedDay = ref(null);
const logSelected = (day: any) => {
  selectedDay.value = day;
};

const setYear = (newYear: number) => {
  // Update both the query year and display year when user selects a year
  queryYear.value = newYear;
  displayYear.value = newYear;
};

// Current year for the max range
const currentYear = computed(() => new Date().getFullYear());
</script>
<template>
  <div class="rounded-lg overflow-hidden">
    <client-only>
      <GithubContributionChart
        :dark-mode="isDarkMode"
        :contribution-data="contributions"
        :loading="loading"
        :year="displayYear"
        :min-year="minYear"
        :max-year="currentYear"
        @day-select="logSelected"
        @year-select="setYear"
      >
        <template #fallback>
          <ContributionChartSkeleton :dark-mode="isDarkMode" />
        </template>
      </GithubContributionChart>
    </client-only>
  </div>
</template>

