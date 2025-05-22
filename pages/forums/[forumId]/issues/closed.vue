<script lang="ts">
  import { computed, defineComponent } from "vue";
  import type { Issue } from "@/__generated__/graphql";
  import { GET_CLOSED_ISSUES_BY_CHANNEL } from "@/graphQLData/issue/queries";
  import { useQuery } from "@vue/apollo-composable";
  import { useRoute } from "nuxt/app";
  import { DateTime } from "luxon";
  import IssueListItem from "@/components/mod/ModIssueListItem.vue";

  export default defineComponent({
    components: {
      IssueListItem,
    },
    setup() {
      const route = useRoute();

      const channelId = computed(() => {
        if (typeof route.params.forumId !== "string") {
          return "";
        }
        return route.params.forumId;
      });

      const {
        result: getClosedIssuesByChannelResult,
        error: getClosedIssuesByChannelError,
        loading: getClosedIssuesByChannelLoading,
      } = useQuery(GET_CLOSED_ISSUES_BY_CHANNEL, {
        channelUniqueName: channelId.value,
      });

      const closedIssues = computed<Issue[]>(() => {
        if (getClosedIssuesByChannelLoading.value || getClosedIssuesByChannelError.value) {
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
    class="divide-y divide-gray-200 border-t border-gray-300 dark:divide-gray-800 dark:border-gray-300 dark:text-white"
    data-testid="issue-list"
  >
    <IssueListItem
      v-for="issue in closedIssues"
      :key="issue.id"
      :channel-id="channelId"
      :issue="issue"
    />
  </ul>
</template>

<style scoped>
  .text-wrap {
    overflow-wrap: break-word;
  }
</style>
