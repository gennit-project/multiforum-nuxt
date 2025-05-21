<script lang="ts" setup>
  import { computed, defineProps } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_EVENT_ISSUE } from "@/graphQLData/mod/queries";
  import ArchiveBox from "@/components/icons/ArchiveBox.vue";

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

  const issueId = computed(() => {
    return getEventIssueResult.value?.eventChannels[0]?.RelatedIssues[0]?.id;
  });

  const markdownLinkToIssue = computed(() => {
    if (issueId.value) {
      return `[archived](/forums/${props.channelId}/issues/${issueId.value})`;
    }
    return null;
  });

  const text = computed(() => {
    return `This event is ${markdownLinkToIssue.value ?? "archived"}. New comments cannot be added.`;
  });
</script>
<template>
  <InfoBanner
    :test-id="'archived-event-banner'"
    :text="text"
  >
    <ArchiveBox class="h-5 w-5" />
  </InfoBanner>
</template>
