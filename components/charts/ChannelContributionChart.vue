<script setup lang="ts">
import { computed } from 'vue';
import { useUIStore } from '@/stores/uiStore';
import ContributionLineChart from './ContributionLineChart.vue';
import type { DayData } from '@/types/contribution';

const props = defineProps<{
  dayData: DayData[];
}>();

// Get the theme from UI store
const uiStore = useUIStore();
const isDarkMode = computed(() => uiStore.theme === 'dark');
</script>

<template>
  <div>
    <ClientOnly>
      <ContributionLineChart :day-data="dayData" :dark-mode="isDarkMode" />
    </ClientOnly>
  </div>
</template>
