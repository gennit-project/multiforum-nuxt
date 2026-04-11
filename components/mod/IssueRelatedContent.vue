<script lang="ts" setup>
import { computed } from 'vue';
import DiscussionDetails from '@/components/mod/DiscussionDetails.vue';
import EventDetail from '@/components/event/detail/EventDetail.vue';
import CommentDetails from '@/components/mod/CommentDetails.vue';
import ImageDetails from '@/components/mod/ImageDetails.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import SuspendModButton from '@/components/mod/SuspendModButton.vue';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  LockedBy?: { displayName?: string };
};

const props = defineProps<{
  activeIssue: Issue;
  reportCount: number | null;
  reportCountLabel: string;
  channelId?: string;
  isAuthorMod?: boolean;
  suspendModDisabled?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'fetchedOriginalAuthorUsername' | 'fetchedOriginalModProfileName',
    value: string
  ): void;
  (e: 'suspendedModSuccessfully' | 'unsuspendedModSuccessfully'): void;
}>();

const getContentTypeLabel = (issue: Issue) => {
  if (issue.relatedDiscussionId) return 'discussion';
  if (issue.relatedEventId) return 'event';
  if (issue.relatedImageId) return 'image';
  return 'comment';
};

// Show suspend mod button when the issue target is a mod
const showSuspendModButton = computed(() => {
  return props.isAuthorMod && props.activeIssue?.relatedModProfileName;
});
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <h2 class="text-xl font-bold">
      Original {{ getContentTypeLabel(activeIssue) }}
    </h2>
    <div class="flex items-center gap-2">
      <!-- Suspend Mod button for mod-related issues -->
      <SuspendModButton
        v-if="showSuspendModButton"
        :issue="activeIssue"
        :disabled="suspendModDisabled"
        @suspended-successfully="emit('suspendedModSuccessfully')"
        @unsuspended-successfully="emit('unsuspendedModSuccessfully')"
      />
      <div
        v-if="reportCount !== null"
        :class="[
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium',
          reportCount > 0
            ? 'bg-red-200 text-red-800 dark:bg-red-900/70 dark:text-red-100'
            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
        ]"
      >
        <FlagIcon class="h-4 w-4" aria-hidden="true" />
        {{ reportCountLabel }}
      </div>
    </div>
  </div>
  <div
    id="original-post-container"
    class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
  >
    <DiscussionDetails
      v-if="activeIssue?.relatedDiscussionId"
      :active-issue="activeIssue"
      :channel-id="props.channelId"
      @fetched-original-author-username="
        emit('fetchedOriginalAuthorUsername', $event)
      "
    />
    <ClientOnly>
      <EventDetail
        v-if="activeIssue?.relatedEventId"
        :issue-event-id="activeIssue.relatedEventId"
        :show-comments="false"
        :show-menu-buttons="false"
        :username-on-top="true"
        :show-add-to-calendar="false"
        :show-event-in-past-banner="false"
        :show-title="true"
        @fetched-original-poster-username="
          emit('fetchedOriginalAuthorUsername', $event)
        "
      />
    </ClientOnly>
    <CommentDetails
      v-if="activeIssue?.relatedCommentId"
      :comment-id="activeIssue.relatedCommentId"
      @fetched-original-author-username="
        emit('fetchedOriginalAuthorUsername', $event)
      "
      @fetched-original-mod-profile-name="
        emit('fetchedOriginalModProfileName', $event)
      "
    />
    <ImageDetails
      v-if="activeIssue?.relatedImageId"
      :image-id="activeIssue.relatedImageId"
      @fetched-original-author-username="
        emit('fetchedOriginalAuthorUsername', $event)
      "
    />
    <slot name="issue-body" />
  </div>
</template>
