<script lang="ts">
import { computed, defineComponent } from "vue";
import { Issue } from "@/__generated__/graphql";
import { GET_CLOSED_ISSUES_BY_CHANNEL } from "@/graphQLData/issue/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "vue-router";
import { DateTime } from "luxon";

export default defineComponent({
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId !== "string") {
        return "";
      }
      return route.params.channelId;
    });

    const {
      result: getClosedIssuesByChannelResult,
      error: getClosedIssuesByChannelError,
      loading: getClosedIssuesByChannelLoading,
    } = useQuery(GET_CLOSED_ISSUES_BY_CHANNEL, {
      channelUniqueName: channelId.value,
    });

    const closedIssues = computed<Issue[]>(() => {
      if (
        getClosedIssuesByChannelLoading.value ||
        getClosedIssuesByChannelError.value
      ) {
        return [];
      }
      const channelData = getClosedIssuesByChannelResult.value.channels[0];

      if (!channelData || !channelData.Issues) {
        return [];
      }
      return channelData.Issues;
    });

    return {
      channelId,
      closedIssues,
    };
  },
  methods: {
    formatDate(date: string) {
      return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
    },
  },
});
</script>

<template>
  <ul
    class="divide-y border-t border-gray-200 dark:border-gray-800 divide-gray-200 dark:divide-gray-800"
    data-testid="issue-list"
  >
    <li
      v-for="(issue, index) in closedIssues"
      :key="index"
      class="border-bottom flex flex-col border-gray-200 p-3 pl-8 dark:border-gray-800"
    >
      <div class="text-md flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-purple-500" />

        <router-link
          :to="{
            name: 'IssueDetail',
            params: {
              issueId: issue.id,
              channelId: channelId,
            },
          }"
        >
          {{ issue.title }}
        </router-link>
      </div>
      <div class="ml-6 text-xs text-gray-500 dark:text-gray-400">
        {{
          `Opened on ${formatDate(issue.createdAt)} by ${
            issue.Author?.displayName || "[Deleted]"
          }`
        }}
      </div>
    </li>
  </ul>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>
