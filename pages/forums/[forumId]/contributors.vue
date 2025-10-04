<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL_CONTRIBUTIONS } from '@/graphQLData/channel/queries';
import ChannelContributionChart from '@/components/charts/ChannelContributionChart.vue';
import IconButtonDropdown from '@/components/IconButtonDropdown.vue';
import type { MenuItemType } from '@/components/IconButtonDropdown.vue';
import { DateTime } from 'luxon';

const route = useRoute();
const forumId = computed(() => route.params.forumId as string);

// Time period selector - default to last 3 months
const timeOptions: MenuItemType[] = [
  { label: 'Last Month', value: '1', event: 'select-period' },
  { label: 'Last 3 Months', value: '3', event: 'select-period' },
  { label: 'Last 6 Months', value: '6', event: 'select-period' },
  { label: 'Last Year', value: '12', event: 'select-period' },
  { label: 'All Time', value: 'null', event: 'select-period' },
];

const selectedMonths = ref(3);

const selectedLabel = computed(() => {
  const option = timeOptions.find(opt => parseInt(opt.value) === selectedMonths.value || (opt.value === 'null' && selectedMonths.value === null));
  return option?.label || 'Last 3 Months';
});

const handlePeriodSelect = (value: string) => {
  selectedMonths.value = value === 'null' ? null : parseInt(value);
};

const dateRange = computed(() => {
  if (selectedMonths.value === null) {
    return { startDate: null, endDate: null };
  }
  const endDate = DateTime.now().toISODate();
  const startDate = DateTime.now().minus({ months: selectedMonths.value }).toISODate();
  return { startDate, endDate };
});

// Fetch channel contributors
const { result, loading, error } = useQuery(
  GET_CHANNEL_CONTRIBUTIONS,
  () => ({
    channelUniqueName: forumId.value,
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
    limit: 10,
  }),
  () => ({
    enabled: !!forumId.value,
    fetchPolicy: 'cache-and-network',
  })
);

const contributors = computed(() => {
  return result.value?.getChannelContributions || [];
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Top Contributors
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          View contribution activity for the most active members of this forum
        </p>
      </div>
      <div>
        <IconButtonDropdown
          :items="timeOptions"
          @select-period="handlePeriodSelect"
        >
          {{ selectedLabel }}
          <i class="fa-solid fa-chevron-down ml-1"></i>
        </IconButtonDropdown>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-gray-500 dark:text-gray-400">
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Loading contributors...
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
      <p class="text-sm text-red-800 dark:text-red-200">
        Error loading contributors: {{ error.message }}
      </p>
    </div>

    <!-- Contributors List -->
    <div v-else-if="contributors.length > 0" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div
        v-for="(contributor, index) in contributors"
        :key="contributor.username"
        class="rounded-lg bg-white p-4 shadow dark:bg-gray-800"
      >
        <div class="mb-3 flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
            {{ index + 1 }}
          </div>
          <img
            v-if="contributor.profilePicURL"
            :src="contributor.profilePicURL"
            :alt="contributor.displayName || contributor.username"
            class="h-8 w-8 rounded-full"
          />
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {{ contributor.displayName || contributor.username }}
            </h3>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              @{{ contributor.username }} · {{ contributor.totalContributions }} contribution{{ contributor.totalContributions !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <ChannelContributionChart :day-data="contributor.dayData" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-lg bg-gray-50 p-12 text-center dark:bg-gray-800">
      <i class="fa-solid fa-users mb-4 text-4xl text-gray-400"></i>
      <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
        No contributors yet
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Be the first to contribute to this forum!
      </p>
    </div>
  </div>
</template>
