<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION_ISSUE } from '@/graphQLData/mod/queries';
import ArchiveBox from '@/components/icons/ArchiveBox.vue';

const props = defineProps({
  channelId: {
    type: String,
    required: true,
  },
  discussionChannelId: {
    type: String,
    required: true,
  },
});
const { result: getDiscussionIssueResult } = useQuery(GET_DISCUSSION_ISSUE, {
  discussionChannelId: props.discussionChannelId,
});

const issueNumber = computed(() => {
  return getDiscussionIssueResult.value?.discussionChannels[0]?.RelatedIssues[0]
    ?.issueNumber;
});

const markdownLinkToIssue = computed(() => {
  if (issueNumber.value !== undefined && issueNumber.value !== null) {
    return `[archived](/forums/${props.channelId}/issues/${issueNumber.value})`;
  }
  return null;
});

const text = computed(() => {
  return `This discussion has been ${markdownLinkToIssue.value ?? 'archived'}. New comments cannot be added.`;
});
</script>
<template>
  <InfoBanner :text="text" :test-id="'archived-discussion-banner'">
    <ArchiveBox class="h-5 w-5" />
  </InfoBanner>
</template>
