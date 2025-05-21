<script setup lang="ts">
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { useRoute } from "nuxt/app";
  import { COUNT_CLOSED_ISSUES, COUNT_OPEN_ISSUES } from "@/graphQLData/mod/queries";

  const route = useRoute();

  const channelId = computed(() => {
    if (typeof route.params.forumId !== "string") {
      return "";
    }
    return route.params.forumId;
  });

  const issueId = computed(() => {
    if (typeof route.params.issueId !== "string") {
      return "";
    }
    return route.params.issueId;
  });

  const {
    result: issuesResult,
    error: issuesError,
    loading: issuesLoading,
  } = useQuery(COUNT_OPEN_ISSUES, {
    channelUniqueName: channelId.value,
  });

  const {
    result: closedIssuesResult,
    error: closedIssuesError,
    loading: closedIssuesLoading,
  } = useQuery(COUNT_CLOSED_ISSUES, {
    channelUniqueName: channelId.value,
  });

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
  <div class="border-black bg-white dark:border-gray-600 dark:bg-gray-900 dark:text-white">
    <nav
      v-if="!issueId"
      class="flex items-center gap-4 py-3 pl-8"
    >
      <nuxt-link
        class="border-b-2 px-4 py-2"
        :class="{
          'border-black text-black dark:border-white dark:text-white':
            route.name === 'forums-forumId-issues',
          'border-gray-500 text-gray-500 dark:text-gray-400':
            route.name !== 'forums-forumId-issues',
        }"
        :to="{ name: 'forums-forumId-issues', params: { forumId: channelId } }"
      >
        <i class="far fa-dot-circle" /> {{ openCount }} Open
      </nuxt-link>
      <nuxt-link
        class="border-b-2 px-4 py-2"
        :class="{
          'border-black text-black dark:border-white dark:text-white':
            route.name === 'forums-forumId-issues-closed',
          'border-gray-500 text-gray-500 dark:text-gray-400':
            route.name !== 'forums-forumId-issues-closed',
        }"
        :to="{ name: 'forums-forumId-issues-closed', params: { forumId: channelId } }"
      >
        <i class="fa-regular fa-circle-check" /> {{ closedCount }} Closed
      </nuxt-link>
    </nav>
    <NuxtPage />
  </div>
</template>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f4f4f4;
  }
  .list-item-icon {
    /* Style for the dot circle icon */
    margin-right: 8px;
    color: green; /* or any color you prefer */
  }
</style>
