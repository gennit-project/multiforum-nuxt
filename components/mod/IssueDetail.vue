<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_ISSUE } from '@/graphQLData/issue/queries';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { GET_EVENT } from '@/graphQLData/event/queries';
import { GET_COMMENT } from '@/graphQLData/comment/queries';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { DateTime } from 'luxon';
import type {
  EventChannel,
  DiscussionChannel,
  Issue,
} from '@/__generated__/graphql';
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
import IssueRelatedChannel from '@/components/mod/IssueRelatedChannel.vue';
import { useModProfileName, useUsername } from '@/composables/useAuthState';
import { useRoute } from 'nuxt/app';
import { config } from '@/config';
import {
  getReportCount,
  formatReportCountLabel,
  hasRelatedContent as checkHasRelatedContent,
} from '@/utils/issueDetailDisplay';

// Composables
import { useIssueOriginalPoster } from '@/composables/useIssueOriginalPoster';
import { useIssueCloseReopen } from '@/composables/useIssueCloseReopen';
import {
  useIssueActivityFeed,
  type FetchMoreIssue,
} from '@/composables/useIssueActivityFeed';
import { useIssueLock } from '@/composables/useIssueLock';
import { useIssueBodyEdit } from '@/composables/useIssueBodyEdit';
import { useIssueModerationActions } from '@/composables/useIssueModerationActions';
import { useIssueSubscription } from '@/composables/useIssueSubscription';
import NotificationComponent from '@/components/NotificationComponent.vue';
import IssueSubscriptionPanel from '@/components/mod/IssueSubscriptionPanel.vue';
import { provideForumRoleMembership } from '@/composables/useForumRoleMembership';
import { useResolvedModPermissions } from '@/composables/useResolvedModPermissions';
import TagComponent from '@/components/TagComponent.vue';

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();

const props = defineProps({
  channelId: {
    type: String,
    required: false,
    default: '',
  },
  issueNumber: {
    type: Number,
    required: false,
    default: null,
  },
});

const ACTIVITY_FEED_PAGE_SIZE = 10;

// Setup
const route = useRoute();

// Route and issueNumber computations
const channelId = computed(() => {
  if (props.channelId) return props.channelId;
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

provideForumRoleMembership(channelId);

const issueNumber = computed(() => {
  if (props.issueNumber !== null) return props.issueNumber;
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
  fetchMore: fetchMoreIssue,
  onResult: onIssueResult,
} = useQuery(
  GET_ISSUE,
  () => ({
    channelUniqueName: channelId.value,
    issueNumber: issueNumber.value,
    activityFeedLimit: ACTIVITY_FEED_PAGE_SIZE,
    activityFeedOffset: 0,
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

const {
  isIssueSubscribed,
  showSubscribeCta,
  showIssueSubscriptionNotification,
  issueSubscriptionNotificationTitle,
  subscribeToIssueLoading,
  unsubscribeFromIssueLoading,
  toggleIssueSubscription,
  dismissSubscribeCta,
} = useIssueSubscription({
  activeIssue,
  username: computed(() => usernameVar.value),
  refetchIssue,
});

const relatedDiscussionId = computed(
  () => activeIssue.value?.relatedDiscussionId || ''
);
const issueChannelUniqueName = computed(
  () => activeIssue.value?.channelUniqueName || channelId.value
);
const relatedEventId = computed(() => activeIssue.value?.relatedEventId || '');
const relatedCommentId = computed(
  () => activeIssue.value?.relatedCommentId || ''
);
const relatedChannelUniqueName = computed(
  () => activeIssue.value?.relatedChannelUniqueName || ''
);

const { result: relatedDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: relatedDiscussionId.value,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: issueChannelUniqueName.value,
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!relatedDiscussionId.value,
  })
);

const relatedDiscussion = computed(() => {
  return relatedDiscussionResult.value?.discussions?.[0] ?? null;
});

const { result: relatedEventResult } = useQuery(
  GET_EVENT,
  () => ({
    id: relatedEventId.value,
    channelUniqueName: issueChannelUniqueName.value,
    loggedInModName: modProfileNameVar.value,
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!relatedEventId.value && !!issueChannelUniqueName.value,
  })
);

const relatedEvent = computed(() => {
  return relatedEventResult.value?.events?.[0] ?? null;
});

const { result: relatedCommentResult } = useQuery(
  GET_COMMENT,
  () => ({
    id: relatedCommentId.value,
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!relatedCommentId.value,
  })
);

const relatedComment = computed(() => {
  return relatedCommentResult.value?.comments?.[0] ?? null;
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

const channelPermissionData = computed(
  () => getChannelResult.value?.channels?.[0] ?? null
);
const serverConfig = computed(
  () => getServerResult.value?.serverConfigs?.[0] ?? null
);
const { userPermissions: modPermissions } = useResolvedModPermissions({
  channelData: channelPermissionData,
  serverConfig,
  username: computed(() => usernameVar.value),
  modProfileName: computed(() => modProfileNameVar.value),
});

const isSuspendedMod = computed(() => {
  return modPermissions.value.isSuspendedMod ?? false;
});

// Use composables
const { closeIssue, closeIssueLoading, reopenIssue, reopenIssueLoading } =
  useIssueCloseReopen({
    activeIssueId,
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
  activityFeedItems,
  hasMoreActivityFeed,
  loadMoreActivityFeed,
  resetActivityFeed,
} = useIssueActivityFeed({
  channelId,
  activityFeedLimit: ACTIVITY_FEED_PAGE_SIZE,
  issueNumber,
  activeIssue,
  getIssueLoading,
  // Apollo's fetchMore is generic over its data/variables; narrow it to the
  // composable's concrete merge shape (variables + updateQuery are identical).
  fetchMoreIssue: fetchMoreIssue as unknown as FetchMoreIssue,
  refetchIssue,
  onIssueResult,
});

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
  refetchIssue: resetActivityFeed,
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
  isSuspendedMod,
  refetchIssue: resetActivityFeed,
});

const issue = computed<Issue | null>(() => activeIssue.value || null);

const hasRelatedContent = computed(() =>
  checkHasRelatedContent(activeIssue.value)
);

const reportCount = computed(() => getReportCount(activeIssue.value));

const reportCountLabel = computed(() =>
  formatReportCountLabel(reportCount.value)
);

const extractChannelUniqueNames = (
  channels:
    | Array<Pick<DiscussionChannel, 'channelUniqueName'>>
    | Array<Pick<EventChannel, 'channelUniqueName'>>
    | null
    | undefined
): string[] => {
  if (!channels) return [];

  return channels
    .map((channel) => channel.channelUniqueName)
    .filter((channelName: string | null | undefined): channelName is string =>
      Boolean(channelName)
    );
};

const issueContextChannels = computed<string[]>(() => {
  const discussionChannels = extractChannelUniqueNames(
    relatedDiscussion.value?.DiscussionChannels as DiscussionChannel[] | null | undefined
  );
  if (discussionChannels.length > 0) {
    return [...new Set(discussionChannels)];
  }

  const eventChannels = extractChannelUniqueNames(
    relatedEvent.value?.EventChannels as EventChannel[] | null | undefined
  );
  if (eventChannels.length > 0) {
    return [...new Set(eventChannels)];
  }

  if (activeIssue.value?.Channel?.uniqueName) {
    return [activeIssue.value.Channel.uniqueName];
  }

  if (activeIssue.value?.channelUniqueName) {
    return [activeIssue.value.channelUniqueName];
  }

  return [];
});

const shouldShowIssueDetailsSection = computed(() => {
  return (
    hasRelatedContent.value || !!activeIssue.value?.body || isIssueAuthor.value
  );
});

const {
  isAuthorBot,
  resolvedOriginalAuthorUsername,
  resolvedOriginalModProfileName,
  isOriginalUserAuthor,
  isOriginalModAuthor,
  isCurrentUserOriginalPoster,
  authorType,
  issueActionVisibility,
} = useIssueOriginalPoster({
  relatedDiscussion,
  relatedEvent,
  relatedComment,
  username: computed(() => usernameVar.value),
  modProfileName: computed(() => modProfileNameVar.value),
  hasRelatedContent,
});

const {
  createFormValues,
  deleteReasonError,
  updateComment,
  handleCreateComment,
  toggleCloseOpenIssue,
  handleDeleteRelatedContent,
} = useIssueModerationActions({
  activeIssue,
  channelId,
  username: computed(() => usernameVar.value),
  modProfileName: computed(() => modProfileNameVar.value),
  isSuspendedMod,
  isOriginalUserAuthor,
  isOriginalModAuthor,
  isCurrentUserOriginalPoster,
  closeIssue,
  reopenIssue,
  addIssueActivityFeedItem,
  addIssueActivityFeedItemWithCommentAsMod,
  addIssueActivityFeedItemWithCommentAsUser,
  resetActivityFeed,
  refetchChannel,
});

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

    <!-- Related Channel (for server-scoped channel reports) -->
    <div v-if="relatedChannelUniqueName" class="px-4 pt-2">
      <IssueRelatedChannel :related-channel-unique-name="relatedChannelUniqueName" />
    </div>

    <div v-if="activeIssue" class="mt-2 flex flex-col gap-2 px-4">
      <div
        v-if="issueContextChannels.length"
        class="flex flex-wrap gap-1"
        data-testid="issue-detail-channel-tags"
      >
        <TagComponent
          v-for="channelName in issueContextChannels"
          :key="channelName"
          class="dark:!text-white"
          :tag="channelName"
          :hide-icon="true"
          :channel-mode="true"
        />
      </div>

      <!-- Related Content Section -->
      <IssueRelatedContent
        v-if="shouldShowIssueDetailsSection && hasRelatedContent"
        :active-issue="activeIssue"
        :report-count="reportCount"
        :report-count-label="reportCountLabel"
        :channel-id="channelId"
        :is-author-mod="authorType === 'mod'"
        :suspend-mod-disabled="isSuspendedMod || !issueActionVisibility.modActionsEnabled"
        @suspended-mod-successfully="resetActivityFeed"
        @unsuspended-mod-successfully="resetActivityFeed"
      >
        <template #issue-body>
          <IssueBodyEditor
            v-if="activeIssue?.body || isIssueAuthor"
            :issue-id="activeIssue?.id"
            :issue-body="activeIssue?.body"
            :is-issue-author="isIssueAuthor"
            :is-locked="isLocked"
            :is-suspended-mod="isSuspendedMod"
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
        class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
      >
        <IssueBodyEditor
          v-if="activeIssue?.body || isIssueAuthor"
          :issue-id="activeIssue?.id"
          :issue-body="activeIssue?.body"
          :is-issue-author="isIssueAuthor"
          :is-locked="isLocked"
          :is-suspended-mod="isSuspendedMod"
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

    <div v-if="issue" class="flex justify-center dark:text-white">
      <div class="flex-1">
        <div class="px-4">
          <IssueSubscriptionPanel
            v-if="usernameVar && activeIssue"
            :is-subscribed="isIssueSubscribed"
            :subscribe-loading="subscribeToIssueLoading"
            :unsubscribe-loading="unsubscribeFromIssueLoading"
            :show-cta="showSubscribeCta"
            @toggle="toggleIssueSubscription"
            @dismiss-cta="dismissSubscribeCta"
          />

          <h2 v-if="activeIssue" class="text-xl font-bold">Activity Feed</h2>

          <button
            v-if="activeIssue && hasMoreActivityFeed"
            type="button"
            class="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            :disabled="getIssueLoading"
            @click="loadMoreActivityFeed"
          >
            Load older posts
          </button>
          <ActivityFeed
            v-if="activeIssue || activityFeedItems.length"
            class="mb-6"
            :feed-items="activityFeedItems"
            :original-user-author-username="resolvedOriginalAuthorUsername"
            :original-mod-author-name="resolvedOriginalModProfileName"
            :related-discussion="relatedDiscussion"
            :issue="activeIssue"
            :suspend-mod-disabled="
              isSuspendedMod || !issueActionVisibility.modActionsEnabled
            "
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
          <div
            v-if="isSuspendedMod"
            class="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-gray-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-gray-200"
          >
            Your moderator account is suspended. You can still use your user
            account where normal user permissions allow it, but moderation
            actions remain disabled until the suspension is reversed or expires.
          </div>

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
            :report-count="reportCount ?? undefined"
            :is-author-bot="isAuthorBot"
            @archived-successfully="resetActivityFeed"
            @unarchived-successfully="resetActivityFeed"
            @suspended-user-successfully="resetActivityFeed"
            @suspended-mod-successfully="resetActivityFeed"
            @unsuspended-user-successfully="resetActivityFeed"
            @unsuspended-mod-successfully="resetActivityFeed"
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
            :is-locked="isLocked"
            :is-closed="!activeIssue?.isOpen"
            @delete-discussion="(id: string) => handleDeleteRelatedContent('discussion', id)"
            @delete-event="(id: string) => handleDeleteRelatedContent('event', id)"
            @delete-comment="(id: string) => handleDeleteRelatedContent('comment', id)"
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
      </div>
    </div>

    <!-- Lock Issue Dialog -->
    <IssueLockDialog
      v-if="showLockDialog"
      :lock-reason-input="lockReasonInput"
      :lock-issue-loading="lockIssueLoading"
      :lock-issue-error="lockIssueError"
      @update:lock-reason-input="handleLockReasonUpdate"
      @close="closeLockDialog"
      @lock="handleLockIssue"
    />
    <NotificationComponent
      v-if="showIssueSubscriptionNotification"
      :title="issueSubscriptionNotificationTitle"
      @close-notification="showIssueSubscriptionNotification = false"
    />
  </div>
</template>
