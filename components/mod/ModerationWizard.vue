<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import type { Issue } from '@/__generated__/graphql';
import ArchiveButton from './ArchiveButton.vue';
import SuspendUserButton from './SuspendUserButton.vue';
import EyeIcon from '../icons/EyeIcon.vue';
import XCircleIcon from '../icons/XCircleIcon.vue';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { modProfileNameVar } from '@/cache';

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
  return !props.issue.isOpen || props.isCurrentUserOriginalPoster;
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
      return [
        { label: 'Edit Discussion Title', testId: 'edit-discussion-title' },
        { label: 'Edit Discussion Body', testId: 'edit-discussion-body' },
      ];
    case 'download':
      return [
        { label: 'Edit Download Title', testId: 'edit-download-title' },
        {
          label: 'Edit Download Description',
          testId: 'edit-download-description',
        },
      ];
    case 'event':
      return [
        { label: 'Edit Event Title', testId: 'edit-event-title' },
        { label: 'Edit Event Description', testId: 'edit-event-description' },
      ];
    default:
      return [];
  }
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
            <EyeIcon class="h-6 w-6 text-white" />
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
            class="border-b border-gray-300 pb-2 text-xl font-bold text-blue-500 dark:border-gray-600"
          >
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
                  class="bg-blue-50 rounded-lg border border-blue-200 p-4 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10"
                >
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
                  class="grid grid-cols-1 gap-4 lg:grid-cols-2"
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
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        Close the issue to log that no moderation action is
                        needed.
                      </p>
                    </div>
                    <button
                      class="flex w-full cursor-pointer items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-orange-500"
                      :loading="closeIssueLoading"
                      @click="$emit('close-issue')"
                    >
                      <XCircleIcon />
                      Close Issue (No Action Needed)
                    </button>
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
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        Address the violation by editing the original post or
                        taking stronger action.
                      </p>
                    </div>

                    <div v-if="editActions.length" class="flex flex-wrap gap-2">
                      <button
                        v-for="action in editActions"
                        :key="action.testId"
                        type="button"
                        :data-test="action.testId"
                        class="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-blue-400 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:text-blue-300"
                        :disabled="actionsDisabled"
                      >
                        {{ action.label }}
                      </button>
                    </div>

                    <div
                      class="border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10 space-y-2 rounded-md border p-3"
                    >
                      <p
                        class="font-semibold text-amber-700 dark:text-amber-300 text-xs uppercase tracking-wide"
                      >
                        Destructive actions
                      </p>
                      <p class="text-amber-800 dark:text-amber-200 text-sm">
                        Only use these when the post clearly breaks rules and
                        the problem cannot be resolved by editing.
                      </p>
                      <div class="flex flex-col gap-2">
                        <ArchiveButton
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
                        <SuspendUserButton
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
                  </div>
                </div>
              </div>
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
            <EyeIcon class="h-6 w-6 text-white" />
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
