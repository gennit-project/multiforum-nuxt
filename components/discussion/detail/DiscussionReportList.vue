<script lang="ts">
import { computed, defineComponent } from "vue";
import { GET_ISSUES_BY_DISCUSSION } from "@/graphQLData/issue/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "DiscussionReportList",
  components: {
  },
  props: {

  },
  setup() {
    const route = useRoute();

    const discussionId = computed(() => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
      }
      return "";
    });

    const {
      result: getIssuesByDiscussionResult,
      error: getIssuesByDiscussionError,
      loading: getIssuesByDiscussionLoading,
    } = useQuery(GET_ISSUES_BY_DISCUSSION, { 
      discussionId: discussionId
    });

    const relatedIssues = computed(() => {
      if (getIssuesByDiscussionLoading.value || getIssuesByDiscussionError.value) {
        return [];
      }
      const discussionData = getIssuesByDiscussionResult.value.discussions[0];
      return discussionData.RelatedIssues;
    });

    return {
      getIssuesByDiscussionResult,
      getIssuesByDiscussionError,
      getIssuesByDiscussionLoading,
      relatedIssues
    }
  }
});
</script>
<template>
  <ul>
    <li
      v-for="issue in relatedIssues"
      :key="issue.id"
    >
      {{ issue.title }}
    </li>
    <li v-if="relatedIssues.length === 0">
      No reports found
    </li>
    <li v-if="getIssuesByDiscussionError">
      Error fetching reports
    </li>
    <li v-if="getIssuesByDiscussionLoading">
      Loading reports
    </li>
  </ul>
</template>