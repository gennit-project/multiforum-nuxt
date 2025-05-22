<script lang="ts">
  import { computed, defineComponent } from "vue";
  import type { Issue } from "@/__generated__/graphql";
  import { GET_ISSUES_BY_CHANNEL } from "@/graphQLData/issue/queries";
  import { useQuery } from "@vue/apollo-composable";
  import { useRoute } from "nuxt/app";
  import ModIssueListItem from "./ModIssueListItem.vue";

  export default defineComponent({
    components: {
      ModIssueListItem,
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
  });
</script>

<template>
  <ul
    class="divide-y border-t border-gray-300 dark:border-gray-800 dark:text-white"
    data-testid="issue-list"
  >
    <ModIssueListItem
      v-for="issue in issues"
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
