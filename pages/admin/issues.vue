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
  <div class="border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900 dark:text-white">
    <nav class="flex items-center gap-4 py-3 pl-8">
      <nuxt-link
        class="border-b-2 px-4 py-2"
        :class="{
          'border-black text-black dark:border-white dark:text-white':
            route.name === 'admin-issues',
          'border-gray-500 text-gray-500 dark:text-gray-400': route.name !== 'admin-issues',
        }"
        :to="{
          name: 'admin-issues',
        }"
      >
        <i class="far fa-dot-circle" /> {{ openCount }} Open
      </nuxt-link>
      <nuxt-link
        class="border-b-2 px-4 py-2"
        :class="{
          'border-black text-black dark:border-white dark:text-white':
            route.name === 'admin-issues-closed',
          'border-gray-500 text-gray-500 dark:text-gray-400': route.name !== 'admin-issues-closed',
        }"
        :to="{
          name: 'admin-issues-closed',
        }"
      >
        <i class="fa-regular fa-circle-check" /> {{ closedCount }} Closed
      </nuxt-link>
    </nav>
    <NuxtPage />
  </div>
</template>
