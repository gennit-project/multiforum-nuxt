<script lang="ts" setup>
import { computed, defineProps } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_COMMENT_ISSUE } from "@/graphQLData/mod/queries";
import ArchiveBox from "@/components/icons/ArchiveBox.vue";

const props = defineProps({
  channelId: {
    type: String,
    required: true,
  },
  commentId: {
    type: String,
    required: true,
  },
});

const { result: getCommentIssueResult } = useQuery(GET_COMMENT_ISSUE, {
  commentId: props.commentId,
});

const issueId = computed(() => {
  return getCommentIssueResult.value?.comments[0]?.RelatedIssues[0]?.id;
});

const markdownLinkToIssue = computed(() => {
  if (issueId.value) {
    return `[archived](/forums/${props.channelId}/issues/${issueId.value})`;
  }
  return null;
});

const text = computed(() => {
  return `This comment has been ${markdownLinkToIssue.value ?? "archived"}.`;
});
</script>
<template>
  <InfoBanner :text="text">
    <ArchiveBox class="h-5 w-5" />
  </InfoBanner>
</template>
