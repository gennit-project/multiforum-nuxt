import { ref, type Ref } from 'vue';
import type { Comment } from '@/__generated__/graphql';

type DeleteCommentInputData = {
  commentId: string;
  parentCommentId: string;
  replyCount: number;
};

type GiveFeedbackInput = {
  commentData: Comment;
  parentCommentId: string;
};

type EditFeedbackInput = {
  commentData: Comment;
};

type UseCommentSectionModalsReturn = {
  // Delete modal
  showDeleteModal: Ref<boolean>;
  commentToDeleteId: Ref<string>;
  commentToDeleteReplyCount: Ref<number>;
  parentOfCommentToDelete: Ref<string>;
  handleClickDelete: (input: DeleteCommentInputData) => void;

  // Feedback modals
  showFeedbackFormModal: Ref<boolean>;
  showConfirmUndoFeedbackModal: Ref<boolean>;
  showEditCommentFeedbackModal: Ref<boolean>;
  commentToGiveFeedbackOn: Ref<Comment | null>;
  commentToRemoveFeedbackFrom: Ref<Comment | null>;
  parentIdOfCommentToGiveFeedbackOn: Ref<string>;
  handleClickGiveFeedback: (input: GiveFeedbackInput) => void;
  handleClickUndoFeedback: (input: GiveFeedbackInput) => void;
  handleClickEditFeedback: (input: EditFeedbackInput) => void;

  // Report modal
  showBrokenRulesModal: Ref<boolean>;
  commentToReport: Ref<Comment | null>;
  handleClickReport: (comment: Comment) => void;

  // Archive modals
  showArchiveModal: Ref<boolean>;
  showArchiveAndSuspendModal: Ref<boolean>;
  showUnarchiveModal: Ref<boolean>;
  commentToArchiveId: Ref<string>;
  commentToArchiveAndSuspendId: Ref<string>;
  commentToUnarchiveId: Ref<string>;
  handleClickArchive: (commentId: string) => void;
  handleClickArchiveAndSuspend: (commentId: string) => void;
  handleClickUnarchive: (commentId: string) => void;
};

/**
 * Composable that manages modal state and handlers for the comment section.
 * Handles delete, feedback, report, and archive modals.
 *
 * @returns Object with modal visibility refs, data refs, and handler functions
 */
export function useCommentSectionModals(): UseCommentSectionModalsReturn {
  // Delete modal state
  const showDeleteModal = ref(false);
  const commentToDeleteId = ref('');
  const commentToDeleteReplyCount = ref(0);
  const parentOfCommentToDelete = ref('');

  // Feedback modal state
  const showFeedbackFormModal = ref(false);
  const showConfirmUndoFeedbackModal = ref(false);
  const showEditCommentFeedbackModal = ref(false);
  const commentToGiveFeedbackOn: Ref<Comment | null> = ref(null);
  const commentToRemoveFeedbackFrom: Ref<Comment | null> = ref(null);
  const parentIdOfCommentToGiveFeedbackOn = ref('');

  // Report modal state
  const showBrokenRulesModal = ref(false);
  const commentToReport: Ref<Comment | null> = ref(null);

  // Archive modal state
  const showArchiveModal = ref(false);
  const showArchiveAndSuspendModal = ref(false);
  const showUnarchiveModal = ref(false);
  const commentToArchiveId = ref('');
  const commentToArchiveAndSuspendId = ref('');
  const commentToUnarchiveId = ref('');

  // Delete handlers
  function handleClickDelete(input: DeleteCommentInputData) {
    const { commentId, parentCommentId, replyCount } = input;
    showDeleteModal.value = true;
    commentToDeleteId.value = commentId;
    commentToDeleteReplyCount.value = replyCount;
    parentOfCommentToDelete.value = parentCommentId;
  }

  // Feedback handlers
  function handleClickGiveFeedback(input: GiveFeedbackInput) {
    const { commentData, parentCommentId } = input;
    showFeedbackFormModal.value = true;
    parentIdOfCommentToGiveFeedbackOn.value = parentCommentId;
    commentToGiveFeedbackOn.value = commentData;
  }

  function handleClickUndoFeedback(input: GiveFeedbackInput) {
    const { commentData, parentCommentId } = input;
    showConfirmUndoFeedbackModal.value = true;
    parentIdOfCommentToGiveFeedbackOn.value = parentCommentId;
    commentToRemoveFeedbackFrom.value = commentData;
  }

  function handleClickEditFeedback(input: EditFeedbackInput) {
    const { commentData } = input;
    commentToGiveFeedbackOn.value = commentData;
    showEditCommentFeedbackModal.value = true;
  }

  // Report handler
  function handleClickReport(commentData: Comment) {
    commentToReport.value = commentData;
    showBrokenRulesModal.value = true;
  }

  // Archive handlers
  function handleClickArchive(commentId: string) {
    commentToArchiveId.value = commentId;
    showArchiveModal.value = true;
  }

  function handleClickArchiveAndSuspend(commentId: string) {
    commentToArchiveAndSuspendId.value = commentId;
    showArchiveAndSuspendModal.value = true;
  }

  function handleClickUnarchive(commentId: string) {
    commentToUnarchiveId.value = commentId;
    showUnarchiveModal.value = true;
  }

  return {
    // Delete modal
    showDeleteModal,
    commentToDeleteId,
    commentToDeleteReplyCount,
    parentOfCommentToDelete,
    handleClickDelete,

    // Feedback modals
    showFeedbackFormModal,
    showConfirmUndoFeedbackModal,
    showEditCommentFeedbackModal,
    commentToGiveFeedbackOn,
    commentToRemoveFeedbackFrom,
    parentIdOfCommentToGiveFeedbackOn,
    handleClickGiveFeedback,
    handleClickUndoFeedback,
    handleClickEditFeedback,

    // Report modal
    showBrokenRulesModal,
    commentToReport,
    handleClickReport,

    // Archive modals
    showArchiveModal,
    showArchiveAndSuspendModal,
    showUnarchiveModal,
    commentToArchiveId,
    commentToArchiveAndSuspendId,
    commentToUnarchiveId,
    handleClickArchive,
    handleClickArchiveAndSuspend,
    handleClickUnarchive,
  };
}
