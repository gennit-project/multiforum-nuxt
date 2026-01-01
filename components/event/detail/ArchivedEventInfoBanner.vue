<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_EVENT_ISSUE } from '@/graphQLData/mod/queries';
import ArchiveBox from '@/components/icons/ArchiveBox.vue';

const props = defineProps({
  channelId: {
    type: String,
    required: true,
  },
  eventChannelId: {
    type: String,
    required: true,
  },
});
const { result: getEventIssueResult } = useQuery(GET_EVENT_ISSUE, {
  eventChannelId: props.eventChannelId,
});

const issueNumber = computed(() => {
  return getEventIssueResult.value?.eventChannels[0]?.RelatedIssues[0]
    ?.issueNumber;
});

const markdownLinkToIssue = computed(() => {
  if (issueNumber.value !== undefined && issueNumber.value !== null) {
    return `[archived](/forums/${props.channelId}/issues/${issueNumber.value})`;
  }
  return null;
});

const text = computed(() => {
  return `This event is ${markdownLinkToIssue.value ?? 'archived'}. New comments cannot be added.`;
});
</script>
<template>
  <InfoBanner :text="text" :test-id="'archived-event-banner'">
    <ArchiveBox class="h-5 w-5" />
  </InfoBanner>
</template>
