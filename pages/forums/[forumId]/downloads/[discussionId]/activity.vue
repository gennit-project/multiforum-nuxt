<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { useModProfileName } from '@/composables/useAuthState';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';
import LabelChangeHistory from '@/components/discussion/detail/activityFeed/LabelChangeHistory.vue';
import type { Discussion } from '@/__generated__/graphql';

const modProfileNameVar = useModProfileName();

const props = defineProps<{
  discussion?: Discussion;
}>();

const route = useRoute();

const discussionId = computed(() => {
  return typeof route.params.discussionId === 'string'
    ? route.params.discussionId
    : '';
});

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const loggedInUserModName = computed(() => modProfileNameVar.value);

// If discussion is not provided via props, fetch it
const { result: getDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: discussionId.value,
    loggedInModName: loggedInUserModName.value,
    channelUniqueName: channelId.value,
  }),
  {
    enabled: !props.discussion,
  }
);

const discussion = computed<Discussion | null>(() => {
  return props.discussion || getDiscussionResult.value?.discussions?.[0] || null;
});

// Get the active discussion channel for this forum
const activeDiscussionChannel = computed(() => {
  return discussion.value?.DiscussionChannels?.find(
    (dc) => dc.channelUniqueName === channelId.value
  );
});

// Get label change history from the discussion channel
// Using any type until GraphQL types are regenerated
const labelChangeHistory = computed(() => {
  const dc = activeDiscussionChannel.value as any;
  return dc?.LabelChangeHistory || [];
});

// Check if there's any activity to show
const hasTitleEdits = computed(() => {
  return (
    discussion.value?.PastTitleVersions &&
    discussion.value.PastTitleVersions.length > 0
  );
});

const hasLabelChanges = computed(() => {
  return labelChangeHistory.value.length > 0;
});

const hasAnyActivity = computed(() => {
  return hasTitleEdits.value || hasLabelChanges.value;
});
</script>

<template>
  <div class="px-2 py-4">
    <div v-if="!hasAnyActivity" class="text-center text-gray-500 dark:text-gray-400">
      No activity to display yet.
    </div>
    <div v-else class="space-y-4">
      <!-- Title Edit History -->
      <DiscussionTitleVersions
        v-if="discussion && hasTitleEdits"
        :discussion="discussion"
      />

      <!-- Label Change History -->
      <LabelChangeHistory
        v-if="hasLabelChanges"
        :label-change-history="labelChangeHistory"
      />
    </div>
  </div>
</template>
