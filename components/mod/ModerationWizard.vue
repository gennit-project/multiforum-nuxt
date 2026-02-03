<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import type { Issue } from '@/__generated__/graphql';
import ArchiveButton from './ArchiveButton.vue';
import SuspendUserButton from './SuspendUserButton.vue';
import SuspendModButton from './SuspendModButton.vue';
import AdminIcon from '../icons/AdminIcon.vue';
import ScalesIcon from '../icons/ScalesIcon.vue';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { modProfileNameVar } from '@/cache';
import PencilIcon from '../icons/PencilIcon.vue';
import EditContentModal from './EditContentModal.vue';
import CloseIssueAction from './CloseIssueAction.vue';
import {
  GET_DISCUSSION_CHANNEL,
  GET_EVENT_CHANNEL,
  IS_ORIGINAL_POSTER_SUSPENDED,
} from '@/graphQLData/mod/queries';
import { GET_COMMENT_ARCHIVED } from '@/graphQLData/comment/queries';

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  discussionId: {
    type: String,
    required: false,
    default: '',
  },
  eventId: {
    type: String,
    required: false,
    default: '',
  },
  commentId: {
    type: String,
    required: false,
    default: '',
  },
  contextText: {
    type: String,
    required: false,
    default: '',
  },
  channelUniqueName: {
    type: String,
    required: false,
    default: '',
  },
  closeIssueLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
  authorType: {
    type: String,
    required: false,
    default: 'user',
  },
  isSuspendedMod: {
    type: Boolean,
    required: false,
    default: false,
  },
  isCurrentUserOriginalPoster: {
    type: Boolean,
    required: false,
    default: false,
  },
  relatedDiscussionHasDownload: {
    type: Boolean,
    required: false,
    default: null,
  },
  canEditComments: {
    type: Boolean,
    default: false,
  },
  canEditDiscussions: {
    type: Boolean,
    default: false,
  },
  canEditEvents: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    required: false,
    default: null,
  },
});

defineEmits([
  'close-issue',
  'open-issue',
  'archived-successfully',
  'unarchived-successfully',
  'suspended-user-successfully',
  'suspended-mod-successfully',
  'unsuspended-user-successfully',
  'unsuspended-mod-successfully',
]);

// Compute whether actions should be disabled
const actionsDisabled = computed(() => {
  return (
    !props.issue.isOpen || props.isCurrentUserOriginalPoster || props.isSuspendedMod
  );
});

const shouldFetchDiscussion = computed(() => {
  return !!props.discussionId;
});

const { result: getDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: props.discussionId,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: props.channelUniqueName,
  }),
  () => ({
    enabled:
      shouldFetchDiscussion.value &&
      props.relatedDiscussionHasDownload === null &&
      !!props.channelUniqueName,
    fetchPolicy: 'cache-first',
  })
);

const discussionHasDownload = computed(() => {
  if (props.relatedDiscussionHasDownload !== null) {
    return props.relatedDiscussionHasDownload;
  }

  return (
    getDiscussionResult.value?.discussions?.[0]?.hasDownload === true || false
  );
});

// Query to check if content is archived
const { result: getDiscussionChannelResult } = useQuery(
  GET_DISCUSSION_CHANNEL,
  () => ({
    discussionId: props.discussionId,
    channelUniqueName: props.channelUniqueName,
  }),
  () => ({
    enabled: !!props.discussionId && !!props.channelUniqueName,
    fetchPolicy: 'cache-first',
  })
);

const { result: getEventChannelResult } = useQuery(
  GET_EVENT_CHANNEL,
  () => ({
    eventId: props.eventId,
    channelUniqueName: props.channelUniqueName,
  }),
  () => ({
    enabled: !!props.eventId && !!props.channelUniqueName,
    fetchPolicy: 'cache-first',
  })
);

const { result: isCommentArchivedResult } = useQuery(
  GET_COMMENT_ARCHIVED,
  () => ({
    commentId: props.commentId,
  }),
  () => ({
    enabled: !!props.commentId,
    fetchPolicy: 'cache-first',
  })
);

const isArchived = computed(() => {
  if (props.discussionId) {
    return getDiscussionChannelResult.value?.discussionChannels?.[0]?.archived;
  } else if (props.eventId) {
    return getEventChannelResult.value?.eventChannels?.[0]?.archived;
  } else if (props.commentId) {
    return isCommentArchivedResult.value?.comments?.[0]?.archived;
  }
  return false;
});

// Query to check if author is suspended
const { result: getUserSuspensionResult } = useQuery(
  IS_ORIGINAL_POSTER_SUSPENDED,
  () => ({
    issueId: props.issue.id,
  }),
  () => ({
    enabled:
      !!props.issue.id &&
      (!!props.commentId || !!props.discussionId || !!props.eventId),
    fetchPolicy: 'cache-first',
  })
);

const authorIsSuspended = computed(() => {
  return getUserSuspensionResult.value?.isOriginalPosterSuspended ?? false;
});

const isAuthorMod = computed(() => props.authorType === 'mod');

const relatedContentType = computed(() => {
  if (props.commentId) return 'comment';
  if (props.eventId) return 'event';
  if (props.discussionId) {
    return discussionHasDownload.value ? 'download' : 'discussion';
  }
  return null;
});

const editActions = computed(() => {
  switch (relatedContentType.value) {
    case 'comment':
      return [{ label: 'Edit Comment', testId: 'edit-comment' }];
    case 'discussion':
      return [{ label: 'Edit title and/or body', testId: 'edit-discussion' }];
    case 'download':
      return [
        {
          label: 'Edit title and/or description',
          testId: 'edit-download',
        },
      ];
    case 'event':
      return [{ label: 'Edit title and/or description', testId: 'edit-event' }];
    default:
      return [];
  }
});

const editModalOpen = ref(false);

const shouldShowEditActions = computed(() => {
  const isReported = typeof props.reportCount === 'number' && props.reportCount > 0;
  return isReported && ['comment', 'discussion'].includes(relatedContentType.value || '');
});

const hasEditPermission = computed(() => {
  switch (relatedContentType.value) {
    case 'comment':
      return props.canEditComments;
    case 'discussion':
    case 'download':
      return props.canEditDiscussions;
    case 'event':
      return props.canEditEvents;
    default:
      return false;
  }
});

const editButtonDisabled = computed(() => {
  return actionsDisabled.value || !hasEditPermission.value;
});
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <div class="flex gap-x-2 pt-12" data-test="mod-wizard">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg"
          :class="[
            issue.isOpen ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700',
          ]"
        >
          <div class="">
            <AdminIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div
          class="flex-1 flex-col space-y-4 rounded-lg border px-4 py-4"
          :class="[
            issue.isOpen && !isCurrentUserOriginalPoster
              ? 'border-blue-500'
              : 'border-gray-300 dark:border-gray-700',
          ]"
        >
          <h1
            v-if="issue.isOpen && !isCurrentUserOriginalPoster"
            class="flex items-center gap-2 border-b border-gray-300 pb-2 text-xl font-bold text-blue-500 dark:border-gray-600"
          >
            <AdminIcon class="h-6 w-6 text-blue-500" />
            Mod Action Needed
          </h1>
          <h1
            v-else
            class="border-b border-gray-300 pb-2 text-xl font-bold text-gray-500 dark:border-gray-600 dark:text-gray-300"
          >
            Mod Actions
          </h1>
          <p v-if="!issue.isOpen" class="text-gray-600 dark:text-gray-400">
            {{ 'Mod actions are disabled because the issue is closed.' }}
          </p>
          <p
            v-else-if="isSuspendedMod"
            class="text-gray-600 dark:text-gray-400"
          >
            {{
              'Mod actions are disabled because your moderator account is suspended.'
            }}
          </p>
          <p
            v-else-if="isCurrentUserOriginalPoster"
            class="text-gray-600 dark:text-gray-400"
          >
            {{
              'Mod actions are disabled because you are the author of the original post.'
            }}
          </p>
          <RequireAuth :full-width="true">
            <template #has-auth>
              <div class="mt-4 flex flex-col space-y-4">
                <div
                  v-if="issue.isOpen && !isCurrentUserOriginalPoster"
                  class="bg-blue-50 flex items-start gap-4 rounded-lg border border-blue-200 p-4 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10"
                >
                  <div class="flex-shrink-0 pt-1">
                    <ScalesIcon
                      class="h-8 w-8 text-blue-600 dark:text-blue-300"
                    />
                  </div>
                  <div class="space-y-1">
                    <p
                      class="font-semibold text-xs uppercase tracking-wide text-blue-700 dark:text-blue-200"
                    >
                      Decision point
                    </p>
                    <p
                      class="font-semibold text-base text-blue-800 dark:text-blue-100"
                    >
                      Is there a rule violation?
                    </p>
                    <p class="text-sm text-blue-700/90 dark:text-blue-200/80">
                      Choose the path below based on your assessment.
                    </p>
                  </div>
                </div>

                <div
                  v-if="issue.isOpen && !isCurrentUserOriginalPoster"
                  class="flex flex-col gap-4"
                >
                  <div
                    class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60"
                  >
                    <div class="space-y-1">
                      <p
                        class="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        If no (no violation)
                      </p>
                    </div>
                    <div class="flex flex-col gap-2">
                      <CloseIssueAction
                        v-if="!isArchived"
                        :loading="closeIssueLoading"
                        @close-issue="$emit('close-issue')"
                      />
                      <ArchiveButton
                        v-if="isArchived"
                        :discussion-id="discussionId"
                        :event-id="eventId"
                        :comment-id="commentId"
                        :context-text="contextText"
                        :channel-unique-name="channelUniqueName"
                        :issue="issue"
                        :disabled="actionsDisabled"
                        @archived-successfully="$emit('archived-successfully')"
                        @unarchived-successfully="
                          $emit('unarchived-successfully')
                        "
                      />
                      <SuspendModButton
                        v-if="authorIsSuspended && isAuthorMod"
                        :issue="issue"
                        :disabled="actionsDisabled"
                        @suspended-successfully="
                          $emit('suspended-mod-successfully')
                        "
                        @unsuspended-successfully="
                          $emit('unsuspended-mod-successfully')
                        "
                      />
                      <SuspendUserButton
                        v-else-if="authorIsSuspended"
                        :issue="issue"
                        :discussion-title="contextText"
                        :discussion-id="discussionId"
                        :event-title="contextText"
                        :event-id="eventId"
                        :channel-unique-name="channelUniqueName"
                        :disabled="actionsDisabled"
                        @suspended-successfully="
                          $emit('suspended-user-successfully')
                        "
                        @unsuspended-successfully="
                          $emit('unsuspended-user-successfully')
                        "
                      />
                    </div>
                  </div>

                  <div
                    class="bg-gray-50 space-y-3 rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
                    :class="[
                      actionsDisabled ? 'opacity-60 grayscale' : 'opacity-100',
                    ]"
                  >
                    <div class="space-y-1">
                      <p
                        class="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        If yes (violation)
                      </p>
                    </div>

                    <div v-if="isArchived" class="flex flex-col gap-2">
                      <CloseIssueAction
                        :loading="closeIssueLoading"
                        @close-issue="$emit('close-issue')"
                      />
                    </div>

                    <div
                      v-if="shouldShowEditActions && editActions.length"
                      class="flex flex-col gap-2"
                    >
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        As an alternative to simply closing the issue, you can
                        address the violation by editing the original post or
                        taking stronger action.
                      </p>
                      <p
                        v-if="isArchived && shouldShowEditActions"
                        class="text-sm text-gray-700 dark:text-gray-300"
                      >
                        You can first edit, then unarchive the content.
                      </p>
                      <button
                        v-for="action in editActions"
                        :key="action.testId"
                        type="button"
                        :data-test="action.testId"
                        class="font-semibold flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm text-white transition"
                        :class="[
                          editButtonDisabled
                            ? 'cursor-not-allowed bg-gray-500'
                            : 'cursor-pointer bg-blue-500 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700',
                        ]"
                        :disabled="editButtonDisabled"
                        :title="
                          !hasEditPermission
                            ? 'You do not have permission to edit this content.'
                            : ''
                        "
                        @click="editModalOpen = true"
                      >
                        <PencilIcon class="h-4 w-4" />
                        {{ action.label }}
                      </button>
                    </div>

                    <div
                      class="border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10 -mx-4 -mb-4 space-y-3 rounded-b-lg p-4"
                    >
                      <p
                        class="font-semibold text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300"
                      >
                        Destructive actions
                      </p>
                      <p class="text-sm text-gray-800 dark:text-gray-300">
                        Only use these when the post clearly breaks rules and
                        the problem cannot be resolved by editing.
                      </p>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <!-- Actions on Content -->
                        <div class="space-y-2">
                          <p
                            class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400"
                          >
                            Actions on Content
                          </p>
                          <ArchiveButton
                            v-if="!isArchived"
                            :discussion-id="discussionId"
                            :event-id="eventId"
                            :comment-id="commentId"
                            :context-text="contextText"
                            :channel-unique-name="channelUniqueName"
                            :issue="issue"
                            :disabled="actionsDisabled"
                            @archived-successfully="
                              $emit('archived-successfully')
                            "
                            @unarchived-successfully="
                              $emit('unarchived-successfully')
                            "
                          />
                          <button
                            v-else
                            type="button"
                            disabled
                            class="font-semibold flex w-full cursor-not-allowed items-center justify-center gap-2 rounded bg-gray-400 px-4 py-2 text-sm text-white dark:bg-gray-600"
                            title="Content is already archived. Use the Unarchive button above to restore it."
                          >
                            Archive (Already Archived)
                          </button>
                        </div>
                        <!-- Actions on Author -->
                        <div class="space-y-2">
                          <p
                            class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400"
                          >
                            Actions on Author
                          </p>
                          <SuspendModButton
                            v-if="!authorIsSuspended && isAuthorMod"
                            :issue="issue"
                            :disabled="actionsDisabled"
                            @suspended-successfully="
                              $emit('suspended-mod-successfully')
                            "
                            @unsuspended-successfully="
                              $emit('unsuspended-mod-successfully')
                            "
                          />
                          <SuspendUserButton
                            v-else-if="!authorIsSuspended"
                            :issue="issue"
                            :discussion-title="contextText"
                            :discussion-id="discussionId"
                            :event-title="contextText"
                            :event-id="eventId"
                            :channel-unique-name="channelUniqueName"
                            :disabled="actionsDisabled"
                            @suspended-successfully="
                              $emit('suspended-user-successfully')
                            "
                            @unsuspended-successfully="
                              $emit('unsuspended-user-successfully')
                            "
                          />
                          <button
                            v-else
                            type="button"
                            disabled
                            class="font-semibold flex w-full cursor-not-allowed items-center justify-center gap-2 rounded bg-gray-400 px-4 py-2 text-sm text-white dark:bg-gray-600"
                            title="Author is already suspended. Use the Unsuspend Author button above to restore their access."
                          >
                            Suspend Author (Already Suspended)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <EditContentModal
                v-if="relatedContentType"
                :open="editModalOpen"
                :target-type="relatedContentType"
                :issue-id="issue.id"
                :comment-id="commentId"
                :discussion-id="discussionId"
                :event-id="eventId"
                :channel-unique-name="channelUniqueName"
                @close="editModalOpen = false"
                @saved="$emit('archived-successfully')"
              />
            </template>
            <template #does-not-have-auth>
              <div class="mt-4 flex flex-col space-y-4">
                <p class="text-gray-600 dark:text-gray-400">
                  Please log in to access moderation features
                </p>
              </div>
            </template>
          </RequireAuth>
        </div>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex gap-x-2 pt-12">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700"
        >
          <div class="">
            <AdminIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div
          class="flex-1 flex-col space-y-4 rounded-lg border border-gray-300 px-4 py-4 dark:border-gray-700"
        >
          <h1
            class="border-b border-gray-300 pb-2 text-xl font-bold text-gray-500 dark:border-gray-600 dark:text-gray-300"
          >
            Mod Actions
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Please log in to access moderation features
          </p>
        </div>
      </div>
    </template>
  </RequireAuth>
</template>
