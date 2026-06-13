<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'nuxt/app';
import InfoBanner from '@/components/InfoBanner.vue';
import LoadMore from '@/components/LoadMore.vue';
import CommentOnFeedbackPage from './CommentOnFeedbackPage.vue';
import Notification from '../NotificationComponent.vue';
import GenericFeedbackFormModal from '@/components/GenericFeedbackFormModal.vue';
import ConfirmUndoCommentFeedbackModal from '@/components/discussion/detail/ConfirmUndoCommentFeedbackModal.vue';
import EditCommentFeedbackModal from '@/components/comments/EditCommentFeedbackModal.vue';
import type { Comment } from '@/__generated__/graphql';
import type { PropType } from 'vue';
import BrokenRulesModal from '@/components/mod/BrokenRulesModal.vue';
import UnarchiveModal from '@/components/mod/UnarchiveModal.vue';
import { useModerationOutcomeUI } from '@/composables/useModerationOutcomeUI';

type GiveFeedbackInput = {
  commentData: Comment;
  parentCommentId: string;
};

type EditFeedbackInput = {
  commentData: Comment;
};

const props = defineProps({
  addFeedbackCommentToCommentError: {
    type: String,
    required: true,
  },
  addFeedbackCommentToCommentLoading: {
    type: Boolean,
    required: true,
  },
  commentToGiveFeedbackOn: {
    type: Object as PropType<Comment | null | undefined>,
    required: false,
    default: null,
  },
  commentToRemoveFeedbackFrom: {
    type: Object as PropType<Comment | null | undefined>,
    required: false,
    default: null,
  },
  feedbackCommentsAggregate: {
    type: Number,
    required: true,
  },
  feedbackComments: {
    type: Array as () => Comment[],
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  loadMore: {
    type: Function,
    required: true,
  },
  loggedInUserModName: {
    type: String,
    default: '',
  },
  reachedEndOfResults: {
    type: Boolean,
    required: true,
  },
  showFeedbackFormModal: {
    type: Boolean,
    required: true,
  },
  showFeedbackSubmittedSuccessfully: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  'openFeedbackFormModal',
  'updateCommentToGiveFeedbackOn',
  'updateCommentToRemoveFeedbackFrom',
  'addFeedbackCommentToComment',
  'closeFeedbackFormModal',
]);

const route = useRoute();
const channelId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const feedbackId = computed(() =>
  typeof route.params.feedbackId === 'string' ? route.params.feedbackId : ''
);

const showConfirmUndoFeedbackModal = ref(false);
const showEditCommentFeedbackModal = ref(false);
const showCopiedLinkNotification = ref(false);
const feedbackText = ref('');

function handleClickGiveFeedback(input: GiveFeedbackInput) {
  const { commentData, parentCommentId } = input;
  emit('openFeedbackFormModal', { commentData, parentCommentId });
  emit('updateCommentToGiveFeedbackOn', commentData);
}

function handleClickUndoFeedback(input: GiveFeedbackInput) {
  const { commentData } = input;
  showConfirmUndoFeedbackModal.value = true;
  emit('updateCommentToRemoveFeedbackFrom', commentData);
}

function handleClickEditFeedback(input: EditFeedbackInput) {
  const { commentData } = input;
  emit('updateCommentToGiveFeedbackOn', commentData);
  showEditCommentFeedbackModal.value = true;
}

function updateFeedback(text: string) {
  feedbackText.value = text;
}

function handleSubmitFeedback() {
  if (!props.commentToGiveFeedbackOn?.id) {
    console.error('commentId is required to submit feedback');
    return;
  }
  if (!props.loggedInUserModName) {
    console.error('modName is required to submit feedback');
    return;
  }
  const feedbackInput = {
    commentId: props.commentToGiveFeedbackOn?.id,
    text: feedbackText.value,
    modProfileName: props.loggedInUserModName,
    channelId: channelId.value,
  };
  emit('addFeedbackCommentToComment', feedbackInput);
}

const {
  showReportModal: showBrokenRulesModal,
  showArchiveModal,
  showUnarchiveModal,
  showArchiveAndSuspendModal,
  showSuccessfullyReported,
  showSuccessfullyArchived,
  showSuccessfullyUnarchived,
  showSuccessfullyArchivedAndSuspended,
  openReportModal,
  openArchiveModal,
  openUnarchiveModal,
  openArchiveAndSuspendModal,
  closeReportModal,
  closeArchiveModal,
  closeUnarchiveModal,
  closeArchiveAndSuspendModal,
  handleReportedSuccessfully,
  handleArchivedSuccessfully,
  handleUnarchivedSuccessfully,
  handleArchivedAndSuspendedSuccessfully,
  dismissReportedNotification,
  dismissArchivedNotification,
  dismissUnarchivedNotification,
  dismissArchivedAndSuspendedNotification,
} = useModerationOutcomeUI();

const commentToReport = ref<Comment | null>(null);
const commentToArchiveId = ref<string | null>(null);
const commentToUnarchiveId = ref<string | null>(null);
const commentToArchiveAndSuspendId = ref<string | null>(null);
</script>

<template>
  <div class="dark:text-white">
    <h2 class="mt-4 text-wrap text-center text-xl font-bold dark:text-gray-200">
      Feedback Comments ({{ feedbackCommentsAggregate }})
    </h2>
    <InfoBanner
      class="mb-4 mt-2"
      header-text="Feedback should focus on the writing, not the writer."
      text="This is a peer-to-peer critique space, not a popularity contest or a pile-on. If a comment is rude or non-actionable, it can be flagged for review."
    />
    <div
      v-if="feedbackCommentsAggregate === 0"
      class="text-center text-gray-500 dark:text-gray-300"
    >
      No feedback yet.
    </div>
    <NuxtPage
      @show-copied-link-notification="showCopiedLinkNotification = true"
      @click-feedback="handleClickGiveFeedback"
      @click-undo-feedback="handleClickUndoFeedback"
      @click-edit-feedback="handleClickEditFeedback"
    />
    <div v-for="comment in feedbackComments" :key="comment.id">
      <CommentOnFeedbackPage
        v-if="!feedbackId || comment.id !== feedbackId"
        :comment="comment"
        @show-copied-link-notification="showCopiedLinkNotification = true"
        @click-feedback="handleClickGiveFeedback"
        @click-undo-feedback="handleClickUndoFeedback"
        @click-edit-feedback="handleClickEditFeedback"
        @click-report="
          () => {
            commentToReport = comment;
            openReportModal();
          }
        "
        @click-archive="
          () => {
            commentToArchiveId = comment.id;
            openArchiveModal();
          }
        "
        @click-unarchive="
          () => {
            commentToUnarchiveId = comment.id;
            openUnarchiveModal();
          }
        "
        @click-archive-and-suspend="
          () => {
            commentToArchiveAndSuspendId = comment.id;
            openArchiveAndSuspendModal();
          }
        "
      />
    </div>
    <LoadMore
      v-if="!loading && !reachedEndOfResults"
      :reached-end-of-results="reachedEndOfResults"
      @load-more="() => loadMore()"
    />
    <div v-if="loading">Loading...</div>
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showCopiedLinkNotification = false"
    />
    <GenericFeedbackFormModal
      :open="showFeedbackFormModal"
      :loading="addFeedbackCommentToCommentLoading"
      :error="addFeedbackCommentToCommentError"
      @close="emit('closeFeedbackFormModal')"
      @update-feedback="updateFeedback"
      @primary-button-click="handleSubmitFeedback"
    />
    <ConfirmUndoCommentFeedbackModal
      v-if="showConfirmUndoFeedbackModal && commentToRemoveFeedbackFrom"
      :key="loggedInUserModName"
      :open="showConfirmUndoFeedbackModal"
      :comment-id="commentToRemoveFeedbackFrom.id"
      :comment-to-remove-feedback-from="commentToRemoveFeedbackFrom"
      :mod-name="loggedInUserModName"
      @close="showConfirmUndoFeedbackModal = false"
    />
    <EditCommentFeedbackModal
      v-if="showEditCommentFeedbackModal"
      :open="showEditCommentFeedbackModal"
      :comment-id="commentToGiveFeedbackOn?.id || ''"
      :mod-name="loggedInUserModName"
      @close="showEditCommentFeedbackModal = false"
    />

    <BrokenRulesModal
      v-if="showBrokenRulesModal"
      :open="showBrokenRulesModal"
      :comment-id="commentToReport?.id"
      :comment="commentToReport"
      @close="closeReportModal"
      @report-submitted-successfully="handleReportedSuccessfully"
    />
    <BrokenRulesModal
      v-if="commentToArchiveId"
      :open="showArchiveModal"
      :comment-id="commentToArchiveId"
      :archive-after-reporting="true"
      @close="closeArchiveModal"
      @reported-and-archived-successfully="handleArchivedSuccessfully"
    />
    <UnarchiveModal
      v-if="commentToUnarchiveId"
      :open="showUnarchiveModal"
      :comment-id="commentToUnarchiveId"
      @close="closeUnarchiveModal"
      @unarchived-successfully="handleUnarchivedSuccessfully"
    />
    <BrokenRulesModal
      v-if="commentToArchiveAndSuspendId"
      :open="showArchiveAndSuspendModal"
      :title="'Suspend Author'"
      :comment-id="commentToArchiveAndSuspendId"
      :suspend-user-enabled="true"
      :text-box-label="'(Optional) Explain why you are suspending this author:'"
      @close="closeArchiveAndSuspendModal"
      @suspended-user-successfully="handleArchivedAndSuspendedSuccessfully"
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="dismissReportedNotification"
    />
    <Notification
      :show="showSuccessfullyArchived"
      :title="'The content was reported and archived successfully.'"
      @close-notification="dismissArchivedNotification"
    />
    <Notification
      :show="showSuccessfullyArchivedAndSuspended"
      :title="'Archived the post and suspended the author.'"
      @close-notification="dismissArchivedAndSuspendedNotification"
    />
    <Notification
      :show="showSuccessfullyUnarchived"
      :title="'The content was unarchived successfully.'"
      @close-notification="dismissUnarchivedNotification"
    />
  </div>
</template>
