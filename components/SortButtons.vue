<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import TextButtonDropdown from '@/components/TextButtonDropdown.vue';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
  availableSortTypes,
  topSortTypes,
  capitalizeCase,
} from '@/components/comments/getSortFromQuery';

const topOptions = [
  {
    label: 'Day',
    value: topSortTypes.TOP_DAY,
  },
  {
    label: 'Week',
    value: topSortTypes.TOP_WEEK,
  },
  {
    label: 'Month',
    value: topSortTypes.TOP_MONTH,
  },
  {
    label: 'Year',
    value: topSortTypes.TOP_YEAR,
  },
  {
    label: 'All Time',
    value: topSortTypes.TOP_ALL,
  },
];
const sortOptions = [
  {
    label: 'Hot',
    value: availableSortTypes.HOT || 'hot',
  },
  {
    label: 'New',
    value: availableSortTypes.NEW || 'new',
  },
  {
    label: 'Top',
    value: availableSortTypes.TOP || 'top',
  },
];

withDefaults(
  defineProps<{
    showTopOptions?: boolean;
  }>(),
  {
    showTopOptions: true,
  },
);

const route = useRoute();
const router = useRouter();

const activeSortQuery = computed(() => {
  return getSortFromQuery(route.query);
});

const activeTimeFrameQuery = computed(() => {
  return getTimeFrameFromQuery(route.query);
});

const activeTimeFrameLabel = computed(() => {
  return capitalizeCase(activeTimeFrameQuery.value);
});

function handleSort(value: string) {
  router.push({
    query: {
      ...route.query,
      sort: value,
    },
  });
}

function handleTopSort(value: string) {
  router.push({
    query: {
      ...route.query,
      timeFrame: value,
    },
  });
}
</script>

<template>
  <div class="flex items-center space-x-2">
    <TextButtonDropdown
      :label="capitalizeCase(activeSortQuery)"
      :items="sortOptions"
      :show-sort-icon="true"
      @clicked-item="handleSort"
    />
    <TextButtonDropdown
      v-if="showTopOptions && activeSortQuery === availableSortTypes.TOP"
      :label="activeTimeFrameLabel"
      :items="topOptions"
      @clicked-item="handleTopSort"
    />
  </div>
</template>
