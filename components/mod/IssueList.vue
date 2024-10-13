<script lang="ts">
import { computed, defineComponent } from "vue";
import type { Issue } from "@/__generated__/graphql";
import { GET_ISSUES_BY_CHANNEL } from "@/graphQLData/issue/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "vue-router";
import { DateTime } from "luxon";

export default defineComponent({
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.forumId !== "string") {
        return "";
      }
      return route.params.forumId;
    });
    
    const {
      result: getIssuesByChannelResult,
      error: getIssuesByChannelError,
      loading: getIssuesByChannelLoading,
    } = useQuery(GET_ISSUES_BY_CHANNEL, {
      channelUniqueName: channelId.value,
    });

    const issues = computed<Issue[]>(() => {
      if (getIssuesByChannelLoading.value || getIssuesByChannelError.value) {
        return [];
      }
      const channelData = getIssuesByChannelResult.value.channels[0];

      if (!channelData || !channelData.Issues) {
        return [];
      }
      return channelData.Issues;
    });

    return {
      channelId,
      issues,
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
    class="divide-y border-t border-gray-200 dark:border-gray-800 dark:text-white"
    data-testid="issue-list"
  >
    <li
      v-for="(issue, index) in issues"
      :key="index"
      class="border-bottom flex flex-col border-gray-200 p-3 pl-8 dark:border-gray-800"
    >
      <div class="text-md flex items-center font-bold text-base">
        <i class="far fa-dot-circle list-item-icon" />

        <nuxt-link
          :to="{
            name: 'forums-forumId-issues-issueId',
            params: {
              issueId: issue.id,
              forumId: channelId,
            },
          }"
        >
          {{ issue.title }}
        </nuxt-link>
      </div>
      <div class="ml-6 text-xs text-gray-500 dark:text-gray-200">
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
