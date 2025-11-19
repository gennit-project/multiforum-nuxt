<script setup lang="ts">
import { computed } from 'vue';
import { useUIStore } from '@/stores/uiStore';
import ContributionLineChart from './ContributionLineChart.vue';
import type { DayData } from '@/__generated__/graphql';

const props = defineProps<{
  dayData: DayData[];
  maxYValue?: number;
}>();

// Get the theme from UI store
const uiStore = useUIStore();
const isDarkMode = computed(() => uiStore.theme === 'dark');
</script>

<template>
  <div>
    <ClientOnly>
      <ContributionLineChart :day-data="dayData" :dark-mode="isDarkMode" :max-y-value="maxYValue" />
    </ClientOnly>
  </div>
</template>
