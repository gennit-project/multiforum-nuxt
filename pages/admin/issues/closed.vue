<script lang="ts" setup>
import { computed } from "vue";
import type { Issue } from "@/__generated__/graphql";
import { GET_CLOSED_ISSUES } from "@/graphQLData/issue/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";
import ModIssueListItem from "@/components/mod/ModIssueListItem.vue";

const route = useRoute();

const channelId = computed(() => {
  if (typeof route.params.forumId !== "string") {
    return "";
  }
  return route.params.forumId;
});

const {
  result: getIssuesResult,
  error: getIssuesError,
  loading: getIssuesLoading,
} = useQuery(GET_CLOSED_ISSUES);

const issues = computed<Issue[]>(() => {
  if (getIssuesLoading.value || getIssuesError.value) {
    return [];
  }
  return getIssuesResult.value?.issues || [];
});
</script>

<template>
  <ul
    class="divide-y border-t border-gray-300 dark:border-gray-300 dark:text-white"
    data-testid="issue-list"
  >
    <ModIssueListItem
      v-for="issue in issues"
      :key="issue.id"
      :issue="issue"
      :channel-id="channelId"
    />
  </ul>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
