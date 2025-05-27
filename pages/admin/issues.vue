<script lang="ts" setup>
import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";
import {
  SERVER_SCOPED_ISSUE_COUNT,
  SERVER_SCOPED_CLOSED_ISSUE_COUNT,
} from "@/graphQLData/mod/queries";

const route = useRoute();
const {
  result: issuesResult,
  error: issuesError,
  loading: issuesLoading,
} = useQuery(SERVER_SCOPED_ISSUE_COUNT);

const {
  result: closedIssuesResult,
  error: closedIssuesError,
  loading: closedIssuesLoading,
} = useQuery(SERVER_SCOPED_CLOSED_ISSUE_COUNT);

const openCount = computed(() => {
  if (issuesLoading.value || issuesError.value) {
    return 0;
  }
  return issuesResult.value?.issuesAggregate?.count || 0;
});

const closedCount = computed(() => {
  if (closedIssuesLoading.value || closedIssuesError.value) {
    return 0;
  }
  return closedIssuesResult.value?.issuesAggregate?.count || 0;
});
</script>

<template>
<<<<<<< HEAD
  <div class="border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900 dark:text-white">
=======
  <div
    class="bg-white dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
  >
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    <nav class="flex items-center gap-4 py-3 pl-8">
      <nuxt-link
        :to="{
          name: 'admin-issues',
        }"
        class="px-4 py-2 border-b-2"
        :class="{
          'border-gray-300 text-black dark:border-white dark:text-white':
            route.name === 'admin-issues',
<<<<<<< HEAD
          'border-gray-300 text-gray-500 dark:text-gray-400': route.name !== 'admin-issues',
        }"
        :to="{
          name: 'admin-issues',
=======
          'border-gray-500 text-gray-500 dark:text-gray-400':
            route.name !== 'admin-issues',
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        }"
      >
        <i class="far fa-dot-circle" /> {{ openCount }} Open
      </nuxt-link>
      <nuxt-link
        :to="{
          name: 'admin-issues-closed',
        }"
        class="px-4 py-2 border-b-2"
        :class="{
          'border-gray-300 text-black dark:border-white dark:text-white':
            route.name === 'admin-issues-closed',
<<<<<<< HEAD
          'border-gray-300 text-gray-500 dark:text-gray-400': route.name !== 'admin-issues-closed',
        }"
        :to="{
          name: 'admin-issues-closed',
=======
          'border-gray-500 text-gray-500 dark:text-gray-400':
            route.name !== 'admin-issues-closed',
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        }"
      >
        <i class="fa-regular fa-circle-check" /> {{ closedCount }} Closed
      </nuxt-link>
    </nav>
    <NuxtPage />
  </div>
</template>
