<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_ISSUE } from '@/graphQLData/issue/queries';
import { DELETE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { DELETE_EVENT } from '@/graphQLData/event/mutations';
import { DELETE_COMMENT } from '@/graphQLData/comment/mutations';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { DateTime } from 'luxon';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';
import ErrorBanner from '@/components/ErrorBanner.vue';
import 'md-editor-v3/lib/style.css';
import PageNotFound from '@/components/PageNotFound.vue';
import ModerationWizard from '@/components/mod/ModerationWizard.vue';
import OriginalPosterActions from '@/components/mod/OriginalPosterActions.vue';
import ActivityFeed from '@/components/mod/ActivityFeed.vue';
import IssueLockedBanner from '@/components/mod/IssueLockedBanner.vue';
import IssueLockDialog from '@/components/mod/IssueLockDialog.vue';
import IssueCommentForm from '@/components/mod/IssueCommentForm.vue';
import IssueBodyEditor from '@/components/mod/IssueBodyEditor.vue';
import IssueRelatedContent from '@/components/mod/IssueRelatedContent.vue';
import { modProfileNameVar, usernameVar } from '@/cache';
import { useRoute } from 'nuxt/app';
import { getAllPermissions } from '@/utils/permissionUtils';
import { config } from '@/config';
import {
  isCurrentUserOriginalPoster as isOriginalPoster,
  getIssueActionVisibility,
  getOriginalPoster,
} from '@/utils/originalPoster';

// Composables
import { useIssueCloseReopen } from '@/composables/useIssueCloseReopen';
import { useIssueActivityFeed } from '@/composables/useIssueActivityFeed';
import { useIssueLock } from '@/composables/useIssueLock';
import { useIssueBodyEdit } from '@/composables/useIssueBodyEdit';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  LockedBy?: { displayName?: string };
};

// Setup
const route = useRoute();

// Route and issueNumber computations
const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const issueNumber = computed(() => {
  const value = route.params.issueNumber;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
});

// Fetch issue data
const {
  result: getIssueResult,
  error: getIssueError,
  loading: getIssueLoading,
  refetch: refetchIssue,
} = useQuery(
  GET_ISSUE,
  () => ({
    channelUniqueName: channelId.value,
    issueNumber: issueNumber.value,
  }),
  () => ({
    enabled: issueNumber.value !== null,
  })
);

// Setup a query to get channel data (we'll use this for refetching after actions)
const { result: getChannelResult, refetch: refetchChannel } = useQuery(
  GET_CHANNEL,
  () => ({
    uniqueName: channelId.value,
    now: DateTime.local().startOf('hour').toISO(),
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!channelId.value,
  })
);

const { result: getServerResult } = useQuery(GET_SERVER_CONFIG, {
  serverName: config.serverName,
});

const activeIssue = computed<Issue | null>(() => {
  if (getIssueError.value || !getIssueResult.value) return null;
  return getIssueResult.value.issues[0];
});

const activeIssueId = computed(() => activeIssue.value?.id || '');
const relatedDiscussionId = computed(
  () => activeIssue.value?.relatedDiscussionId || ''
);

const { result: relatedDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: relatedDiscussionId.value,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!relatedDiscussionId.value,
  })
);

const relatedDiscussion = computed(() => {
  return relatedDiscussionResult.value?.discussions?.[0] ?? null;
});

const isIssueAuthor = computed(() => {
  const author = activeIssue.value?.Author;
  if (!author) return false;

  if (author.__typename === 'User') {
    return !!usernameVar.value && author.username === usernameVar.value;
  }

  if (author.__typename === 'ModerationProfile') {
    return (
      !!modProfileNameVar.value &&
      author.displayName === modProfileNameVar.value
    );
  }

  return false;
});

const isLocked = computed(() => activeIssue.value?.locked === true);

const standardModRole = computed(() => {
  if (getChannelResult.value?.channels?.[0]?.DefaultModRole) {
    return getChannelResult.value.channels[0].DefaultModRole;
  }
  if (getServerResult.value?.serverConfigs?.[0]?.DefaultModRole) {
    return getServerResult.value.serverConfigs[0].DefaultModRole;
  }
  return null;
});

const elevatedModRole = computed(() => {
  if (getChannelResult.value?.channels?.[0]?.ElevatedModRole) {
    return getChannelResult.value.channels[0].ElevatedModRole;
  }
  if (getServerResult.value?.serverConfigs?.[0]?.DefaultElevatedModRole) {
    return getServerResult.value.serverConfigs[0].DefaultElevatedModRole;
  }
  return null;
});

const permissionData = computed(() => {
  if (getChannelResult.value?.channels?.[0]) {
    return getChannelResult.value.channels[0];
  }
  return null;
});

const modPermissions = computed(() => {
  return getAllPermissions({
    permissionData: permissionData.value,
    standardModRole: standardModRole.value,
    elevatedModRole: elevatedModRole.value,
    username: usernameVar.value,
    modProfileName: modProfileNameVar.value,
  });
});

const isSuspendedMod = computed(() => {
  return modPermissions.value.isSuspendedMod ?? false;
});

const authorType = computed(() => {
  if (originalModProfileName.value) return 'mod';
  if (originalAuthorUsername.value) return 'user';
  return 'user';
});

// Use composables
const { closeIssue, closeIssueLoading, reopenIssue, reopenIssueLoading } =
  useIssueCloseReopen({
    activeIssueId,
    activeIssue,
    channelId,
  });

const {
  addIssueActivityFeedItem,
  addIssueActivityFeedItemWithCommentAsMod,
  addIssueActivityFeedItemWithCommentAsModLoading,
  addIssueActivityFeedItemWithCommentAsModError,
  addIssueActivityFeedItemWithCommentAsUser,
  addIssueActivityFeedItemWithCommentAsUserLoading,
  addIssueActivityFeedItemWithCommentAsUserError,
} = useIssueActivityFeed({ channelId });

const {
  lockReasonInput,
  showLockDialog,
  lockIssueLoading,
  lockIssueError,
  unlockIssueLoading,
  unlockIssueError,
  handleLockIssue,
  handleUnlockIssue,
  openLockDialog,
  closeLockDialog,
} = useIssueLock({
  activeIssueId,
  activeIssue,
  isSuspendedMod,
  refetchIssue,
});

const {
  isEditingIssueBody,
  editedIssueBody,
  updateIssueBodyLoading,
  updateIssueBodyError,
  issueBodyHasChanges,
  startIssueBodyEdit,
  cancelIssueBodyEdit,
  saveIssueBody,
} = useIssueBodyEdit({
  activeIssue,
  activeIssueId,
  isIssueAuthor,
  isLocked,
  refetchIssue,
});

const { mutate: deleteDiscussion } = useMutation(DELETE_DISCUSSION);
const { mutate: deleteEvent } = useMutation(DELETE_EVENT);
const { mutate: deleteComment } = useMutation(DELETE_COMMENT);

// Form values for creating comments
const createCommentDefaultValues = { text: '', isRootComment: true, depth: 1 };
const createFormValues = ref(createCommentDefaultValues);
const deleteReasonError = ref('');

const issue = computed<Issue | null>(
  () => getIssueResult.value?.issues[0] || null
);

const hasRelatedContent = computed(() => {
  return (
    !!activeIssue.value?.relatedDiscussionId ||
    !!activeIssue.value?.relatedEventId ||
    !!activeIssue.value?.relatedCommentId
  );
});

const reportCount = computed(() => {
  const count = activeIssue.value?.ActivityFeedAggregate?.count;
  return typeof count === 'number' ? count : null;
});

const reportCountLabel = computed(() => {
  if (reportCount.value === null) return '';
  return `${reportCount.value} ${reportCount.value === 1 ? 'report' : 'reports'}`;
});

const shouldShowIssueDetailsSection = computed(() => {
  return (
    hasRelatedContent.value || !!activeIssue.value?.body || isIssueAuthor.value
  );
});

// Get the username of the original author of the reported content
const originalAuthorUsername = ref('');

// Get the mod profile name of the original author, if applicable
const originalModProfileName = ref('');

const setOriginalAuthorUsername = (username: string) => {
  if (username) {
    originalAuthorUsername.value = username;
  }
};

const setOriginalModProfileName = (modProfileName: string) => {
  if (modProfileName) {
    originalModProfileName.value = modProfileName;
  }
};

watch(
  () => relatedDiscussion.value?.Author?.username,
  (_username) => {
    const author = getOriginalPoster({ Discussion: relatedDiscussion.value });
    if (author.username) {
      setOriginalAuthorUsername(author.username);
    }
  },
  { immediate: true }
);

watch(
  () => activeIssue.value,
  (currentIssue) => {
    if (!currentIssue || hasRelatedContent.value) return;

    if (
      !originalAuthorUsername.value &&
      currentIssue.Author?.__typename === 'User'
    ) {
      setOriginalAuthorUsername(currentIssue.Author.username || '');
    }

    if (
      !originalModProfileName.value &&
      currentIssue.Author?.__typename === 'ModerationProfile'
    ) {
      setOriginalModProfileName(currentIssue.Author.displayName || '');
    }
  },
  { immediate: true }
);

// Determine if the current user is the original author via username
const isOriginalUserAuthor = computed(() => {
  return (
    !!usernameVar.value && originalAuthorUsername.value === usernameVar.value
  );
});

// Determine if the current user is the original author via mod profile
const isOriginalModAuthor = computed(() => {
  return (
    !!modProfileNameVar.value &&
    originalModProfileName.value === modProfileNameVar.value
  );
});

// Determine if the current user is the original poster (either as user or mod)
const isCurrentUserOriginalPoster = computed(() => {
  return isOriginalPoster({
    originalAuthorUsername: originalAuthorUsername.value,
    originalModProfileName: originalModProfileName.value,
    currentUsername: usernameVar.value,
    currentModProfileName: modProfileNameVar.value,
  });
});

const issueActionVisibility = computed(() => {
  return getIssueActionVisibility({
    hasRelatedContent: hasRelatedContent.value,
    isOriginalPoster: isCurrentUserOriginalPoster.value,
  });
});

const updateComment = (text: string) => {
  createFormValues.value.text = text;
};

const handleCreateComment = async () => {
  if (!activeIssue.value) return;
  if (isSuspendedMod.value && !isOriginalUserAuthor.value) {
    return;
  }

  // Case 1: Current user is the original author who posted as a regular user
  if (isOriginalUserAuthor.value) {
    await addIssueActivityFeedItemWithCommentAsUser({
      issueId: activeIssue.value.id,
      commentText: createFormValues.value.text,
      username: usernameVar.value,
      actionDescription: 'commented on the issue',
      actionType: 'comment',
      channelUniqueName: channelId.value,
    });
  }
  // Case 2: Current user is the original author who posted as a mod
  else if (isOriginalModAuthor.value) {
    if (!modProfileNameVar.value) return;
    await addIssueActivityFeedItemWithCommentAsMod({
      issueId: activeIssue.value.id,
      commentText: createFormValues.value.text,
      displayName: modProfileNameVar.value,
      actionDescription: 'commented on the issue',
      actionType: 'comment',
      channelUniqueName: channelId.value,
    });
  }
  // Case 3: Current user is not the original author - comment as mod
  else {
    if (!modProfileNameVar.value) return;
    await addIssueActivityFeedItemWithCommentAsMod({
      issueId: activeIssue.value.id,
      commentText: createFormValues.value.text,
      displayName: modProfileNameVar.value,
      actionDescription: 'commented on the issue',
      actionType: 'comment',
      channelUniqueName: channelId.value,
    });
  }

  createFormValues.value.text = '';
};

const toggleCloseOpenIssue = async () => {
  if (!activeIssue.value || !modProfileNameVar.value) return;
  if (isSuspendedMod.value) return;

  try {
    if (activeIssue.value.isOpen) {
      // Close the issue
      await closeIssue();

      if (createFormValues.value.text) {
        await addIssueActivityFeedItemWithCommentAsMod({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'closed the issue',
          actionType: 'close',
          commentText: createFormValues.value.text,
          channelUniqueName: channelId.value,
        });
      } else {
        await addIssueActivityFeedItem({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'closed the issue',
          actionType: 'close',
        });
      }
    } else {
      // Reopen the issue
      await reopenIssue();

      if (createFormValues.value.text) {
        await addIssueActivityFeedItemWithCommentAsMod({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'reopened the issue',
          actionType: 'reopen',
          commentText: createFormValues.value.text,
          channelUniqueName: channelId.value,
        });
      } else {
        await addIssueActivityFeedItem({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'reopened the issue',
          actionType: 'reopen',
        });
      }
    }

    // Refetch channel data to update issue counts in the UI
    try {
      await refetchChannel();
    } catch (error) {
      console.error('Error refetching channel data:', error);
    }

    // Reset comment form
    createFormValues.value.text = '';
  } catch (error) {
    console.error('Error toggling issue open/close state:', error);
  }
};

const resolveDeleteReason = () => {
  const trimmedReason = createFormValues.value.text.trim();
  return trimmedReason || 'No reason provided.';
};

const requireDeleteReasonIfNotOp = () => {
  deleteReasonError.value = '';
  if (isCurrentUserOriginalPoster.value) {
    return true;
  }
  if (!createFormValues.value.text.trim()) {
    deleteReasonError.value = 'Please provide a reason before deleting.';
    return false;
  }
  return true;
};

// Handle delete actions from Original Poster Actions
const handleDeleteDiscussion = async (discussionId: string) => {
  if (!discussionId) return;
  if (!requireDeleteReasonIfNotOp()) return;

  try {
    if (modProfileNameVar.value && activeIssue.value) {
      if (activeIssue.value.isOpen) {
        await closeIssue();
      }

      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        displayName: modProfileNameVar.value,
        actionDescription: 'deleted the discussion',
        actionType: 'delete',
        commentText: resolveDeleteReason(),
        channelUniqueName: channelId.value,
      });
    }

    await deleteDiscussion({ id: discussionId });
    createFormValues.value.text = '';
    deleteReasonError.value = '';
    await refetchIssue();
  } catch (error) {
    console.error('Error deleting discussion:', error);
  }
};

const handleDeleteEvent = async (eventId: string) => {
  if (!eventId) return;
  if (!requireDeleteReasonIfNotOp()) return;

  try {
    if (modProfileNameVar.value && activeIssue.value) {
      if (activeIssue.value.isOpen) {
        await closeIssue();
      }

      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        displayName: modProfileNameVar.value,
        actionDescription: 'deleted the event',
        actionType: 'delete',
        commentText: resolveDeleteReason(),
        channelUniqueName: channelId.value,
      });
    }

    await deleteEvent({ id: eventId });
    createFormValues.value.text = '';
    deleteReasonError.value = '';
    await refetchIssue();
  } catch (error) {
    console.error('Error deleting event:', error);
  }
};

const handleDeleteComment = async (commentId: string) => {
  if (!commentId) return;
  if (!requireDeleteReasonIfNotOp()) return;

  try {
    if (modProfileNameVar.value && activeIssue.value) {
      if (activeIssue.value.isOpen) {
        await closeIssue();
      }

      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        displayName: modProfileNameVar.value,
        actionDescription: 'deleted the comment',
        actionType: 'delete',
        commentText: resolveDeleteReason(),
        channelUniqueName: channelId.value,
      });
    }

    await deleteComment({ id: commentId });
    createFormValues.value.text = '';
    deleteReasonError.value = '';
    await refetchIssue();
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
};

const handleLockReasonUpdate = (value: string) => {
  lockReasonInput.value = value;
};
</script>

<template>
  <PageNotFound v-if="!getIssueLoading && !activeIssue" />
  <div
    v-else
    class="mx-1 my-4 flex-1 space-y-2 rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
  >
    <ErrorBanner
      v-if="getIssueError"
      class="mt-2 px-4"
      :text="getIssueError.message"
    />

    <!-- Lock Status Banner -->
    <IssueLockedBanner
      v-if="isLocked"
      :lock-reason="activeIssue?.lockReason"
      :locked-by-display-name="activeIssue?.LockedBy?.displayName"
      :locked-at="activeIssue?.lockedAt"
    />

    <div v-if="activeIssue" class="mt-2 flex flex-col gap-2 px-4">
      <!-- Related Content Section -->
      <IssueRelatedContent
        v-if="shouldShowIssueDetailsSection && hasRelatedContent"
        :active-issue="activeIssue"
        :report-count="reportCount"
        :report-count-label="reportCountLabel"
        @fetched-original-author-username="setOriginalAuthorUsername"
        @fetched-original-mod-profile-name="setOriginalModProfileName"
      >
        <template #issue-body>
          <IssueBodyEditor
            v-if="activeIssue?.body || isIssueAuthor"
            :issue-id="activeIssue?.id"
            :issue-body="activeIssue?.body"
            :is-issue-author="isIssueAuthor"
            :is-locked="isLocked"
            :is-editing-issue-body="isEditingIssueBody"
            :edited-issue-body="editedIssueBody"
            :update-issue-body-loading="updateIssueBodyLoading"
            :update-issue-body-error="updateIssueBodyError"
            :issue-body-has-changes="issueBodyHasChanges"
            @start-edit="startIssueBodyEdit"
            @cancel-edit="cancelIssueBodyEdit"
            @save-edit="saveIssueBody"
            @update:edited-issue-body="editedIssueBody = $event"
          />
        </template>
      </IssueRelatedContent>

      <!-- Issue body only (no related content) -->
      <div
        v-else-if="shouldShowIssueDetailsSection"
        id="original-post-container"
        class="rounded-lg border border-l-4 border-blue-200 border-l-blue-400 bg-blue-50 px-4 py-2 dark:border-gray-600 dark:border-l-blue-500 dark:bg-gray-800"
      >
        <IssueBodyEditor
          v-if="activeIssue?.body || isIssueAuthor"
          :issue-id="activeIssue?.id"
          :issue-body="activeIssue?.body"
          :is-issue-author="isIssueAuthor"
          :is-locked="isLocked"
          :is-editing-issue-body="isEditingIssueBody"
          :edited-issue-body="editedIssueBody"
          :update-issue-body-loading="updateIssueBodyLoading"
          :update-issue-body-error="updateIssueBodyError"
          :issue-body-has-changes="issueBodyHasChanges"
          @start-edit="startIssueBodyEdit"
          @cancel-edit="cancelIssueBodyEdit"
          @save-edit="saveIssueBody"
          @update:edited-issue-body="editedIssueBody = $event"
        />
      </div>
    </div>

    <v-row v-if="issue" class="flex justify-center dark:text-white">
      <v-col>
        <div class="px-4">
          <h2 v-if="activeIssue" class="text-xl font-bold">Activity Feed</h2>

          <ActivityFeed
            v-if="activeIssue"
            :key="activeIssue.id"
            class="mb-6 border-l-4 border-l-blue-400 pl-4 dark:border-l-blue-500"
            :feed-items="activeIssue.ActivityFeed || []"
            :original-user-author-username="originalAuthorUsername"
            :original-mod-author-name="originalModProfileName"
            :related-discussion="relatedDiscussion"
          />

          <ErrorBanner
            v-if="addIssueActivityFeedItemWithCommentAsModError"
            :text="addIssueActivityFeedItemWithCommentAsModError.message"
          />
          <ErrorBanner
            v-if="addIssueActivityFeedItemWithCommentAsUserError"
            :text="addIssueActivityFeedItemWithCommentAsUserError.message"
          />
          <ErrorBanner v-if="deleteReasonError" :text="deleteReasonError" />

          <ModerationWizard
            v-if="issue && issueActionVisibility.showModActions"
            :issue="issue"
            :discussion-id="activeIssue?.relatedDiscussionId || ''"
            :event-id="activeIssue?.relatedEventId || ''"
            :comment-id="activeIssue?.relatedCommentId || ''"
            :channel-unique-name="channelId"
            :close-issue-loading="closeIssueLoading"
            :is-current-user-original-poster="
              !issueActionVisibility.modActionsEnabled
            "
            :author-type="authorType"
            :is-suspended-mod="isSuspendedMod"
            :can-edit-comments="modPermissions.canEditComments"
            :can-edit-discussions="modPermissions.canEditDiscussions"
            :can-edit-events="modPermissions.canEditEvents"
            @archived-successfully="refetchIssue"
            @unarchived-successfully="refetchIssue"
            @suspended-user-successfully="refetchIssue"
            @suspended-mod-successfully="refetchIssue"
            @unsuspended-user-successfully="refetchIssue"
            @unsuspended-mod-successfully="refetchIssue"
            @open-issue="toggleCloseOpenIssue"
            @close-issue="toggleCloseOpenIssue"
          />

          <OriginalPosterActions
            v-if="issue && issueActionVisibility.showOpActions"
            :issue="issue"
            :discussion-id="activeIssue?.relatedDiscussionId || ''"
            :event-id="activeIssue?.relatedEventId || ''"
            :comment-id="activeIssue?.relatedCommentId || ''"
            :channel-unique-name="channelId"
            :is-current-user-original-poster="isCurrentUserOriginalPoster"
            :actions-disabled="!issueActionVisibility.opActionsEnabled"
            @delete-discussion="handleDeleteDiscussion"
            @delete-event="handleDeleteEvent"
            @delete-comment="handleDeleteComment"
          />

          <IssueCommentForm
            v-if="activeIssue"
            :comment-text="createFormValues.text"
            :is-issue-open="activeIssue.isOpen ?? false"
            :is-locked="isLocked"
            :is-suspended-mod="isSuspendedMod"
            :is-original-user-author="isOriginalUserAuthor"
            :close-issue-loading="closeIssueLoading"
            :reopen-issue-loading="reopenIssueLoading"
            :lock-issue-loading="lockIssueLoading"
            :unlock-issue-loading="unlockIssueLoading"
            :comment-loading="
              addIssueActivityFeedItemWithCommentAsModLoading ||
              addIssueActivityFeedItemWithCommentAsUserLoading
            "
            :lock-issue-error="lockIssueError"
            :unlock-issue-error="unlockIssueError"
            @update:comment-text="updateComment"
            @toggle-close-open="toggleCloseOpenIssue"
            @create-comment="handleCreateComment"
            @open-lock-dialog="openLockDialog"
            @unlock-issue="handleUnlockIssue"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Lock Issue Dialog -->
    <IssueLockDialog
      v-if="showLockDialog"
      :lock-reason-input="lockReasonInput"
      :lock-issue-loading="lockIssueLoading"
      @update:lock-reason-input="handleLockReasonUpdate"
      @close="closeLockDialog"
      @lock="handleLockIssue"
    />
  </div>
</template>
