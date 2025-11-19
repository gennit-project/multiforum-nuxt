<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { Activity, DayData } from '@/__generated__/graphql';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  dayData: DayData[];
  darkMode?: boolean;
  maxYValue?: number;
}>();

const chartData = computed(() => {
  // Create a map to aggregate comments and discussions by date
  const dataMap = new Map<string, { comments: number; discussions: number }>();

  props.dayData.forEach((day) => {
    const date = day.date;
    const existing = dataMap.get(date) || { comments: 0, discussions: 0 };

    day.activities.forEach((activity: Activity) => {
      existing.comments += activity.Comments?.length || 0;
      existing.discussions += activity.Discussions?.length || 0;
    });

    dataMap.set(date, existing);
  });

  // Sort by date and create arrays
  const sortedDates = Array.from(dataMap.keys()).sort();
  const comments = sortedDates.map((date) => dataMap.get(date)!.comments);
  const discussions = sortedDates.map((date) => dataMap.get(date)!.discussions);

  return {
    labels: sortedDates.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Comments',
        data: comments,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Discussions',
        data: discussions,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: props.darkMode ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)',
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        color: props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: props.darkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
        maxRotation: 45,
        minRotation: 45,
      },
    },
    y: {
      beginAtZero: true,
      max: props.maxYValue || undefined,
      grid: {
        color: props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: props.darkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
        precision: 0,
      },
    },
  },
}));
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
