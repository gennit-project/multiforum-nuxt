import { ref } from 'vue';
import type { Comment as CommentType } from '@/__generated__/graphql';
import type { CreateEditCommentFormValues } from '@/types/Comment';

const emptyFormValues = (): CreateEditCommentFormValues => ({
  text: '',
  isRootComment: true,
  depth: 1,
});

/**
 * Local reply/edit editor state for the comment section: which comment (if any)
 * is being edited, the in-progress edit form values, which comment has its reply
 * or edit editor open, and the pure open/close transitions. Extracted from
 * CommentSection.vue so this UI state is readable and unit-testable on its own.
 *
 * The submit handlers that actually call mutations (create/edit/delete) stay in
 * CommentSection and drive this state through the exposed refs and the
 * `resetAfterCreate` / `resetAfterUpdate` helpers (called from the mutations'
 * onDone hooks).
 */
export function useCommentFormState() {
  const commentToEdit = ref<CommentType | null>(null);
  const commentInProcess = ref(false);
  const submitAttempted = ref(false);
  const replyFormOpenAtCommentID = ref('');
  const editFormOpenAtCommentID = ref('');
  const editFormValues = ref<CreateEditCommentFormValues>(emptyFormValues());

  const openReplyEditor = (commentId: string) => {
    replyFormOpenAtCommentID.value = commentId;
    editFormOpenAtCommentID.value = ''; // Close edit form if open
  };

  const hideReplyEditor = () => {
    replyFormOpenAtCommentID.value = '';
  };

  const openEditCommentEditor = (commentId: string) => {
    editFormOpenAtCommentID.value = commentId;
    replyFormOpenAtCommentID.value = ''; // Close reply form if open
  };

  const hideEditCommentEditor = () => {
    editFormOpenAtCommentID.value = '';
    commentToEdit.value = null; // Clear edited comment data
  };

  const startEditing = (commentData: CommentType) => {
    commentToEdit.value = commentData;
    editFormOpenAtCommentID.value = commentData.id;
    editFormValues.value = {
      text: commentData.text || '',
      isRootComment: !commentData.ParentComment,
      depth: 1,
    };
  };

  const updateEditInputValues = (text: string, isRootComment: boolean) => {
    editFormValues.value = {
      ...editFormValues.value,
      text,
      isRootComment,
    };
  };

  const updateFeedbackText = (text: string) => {
    editFormValues.value.text = text;
  };

  // Called from the create mutation's onDone.
  const resetAfterCreate = () => {
    commentInProcess.value = false;
    submitAttempted.value = false;
    replyFormOpenAtCommentID.value = '';
  };

  // Called from the update mutation's onDone.
  const resetAfterUpdate = () => {
    commentInProcess.value = false;
    editFormOpenAtCommentID.value = '';
    commentToEdit.value = null;
    editFormValues.value = emptyFormValues();
  };

  return {
    commentToEdit,
    commentInProcess,
    submitAttempted,
    replyFormOpenAtCommentID,
    editFormOpenAtCommentID,
    editFormValues,
    openReplyEditor,
    hideReplyEditor,
    openEditCommentEditor,
    hideEditCommentEditor,
    startEditing,
    updateEditInputValues,
    updateFeedbackText,
    resetAfterCreate,
    resetAfterUpdate,
  };
}
