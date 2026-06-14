import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useCommentSectionModals } from './useCommentSectionModals';
import type { Comment } from '@/__generated__/graphql';

describe('useCommentSectionModals', () => {
  describe('initial state', () => {
    it('should initialize delete modal state as closed', () => {
      const { showDeleteModal } = useCommentSectionModals();

      expect(showDeleteModal.value).toBe(false);
    });

    it('should initialize commentToDeleteId as empty', () => {
      const { commentToDeleteId } = useCommentSectionModals();

      expect(commentToDeleteId.value).toBe('');
    });

    it('should initialize commentToDeleteReplyCount as zero', () => {
      const { commentToDeleteReplyCount } = useCommentSectionModals();

      expect(commentToDeleteReplyCount.value).toBe(0);
    });

    it('should initialize feedback form modal state as closed', () => {
      const { showFeedbackFormModal } = useCommentSectionModals();

      expect(showFeedbackFormModal.value).toBe(false);
    });

    it('should initialize undo feedback modal state as closed', () => {
      const { showConfirmUndoFeedbackModal } = useCommentSectionModals();

      expect(showConfirmUndoFeedbackModal.value).toBe(false);
    });

    it('should initialize edit feedback modal state as closed', () => {
      const { showEditCommentFeedbackModal } = useCommentSectionModals();

      expect(showEditCommentFeedbackModal.value).toBe(false);
    });

    it('should initialize report modal state as closed', () => {
      const { showBrokenRulesModal } = useCommentSectionModals();

      expect(showBrokenRulesModal.value).toBe(false);
    });

    it('should initialize commentToReport as null', () => {
      const { commentToReport } = useCommentSectionModals();

      expect(commentToReport.value).toBe(null);
    });

    it('should initialize archive modal state as closed', () => {
      const { showArchiveModal } = useCommentSectionModals();

      expect(showArchiveModal.value).toBe(false);
    });

    it('should initialize archive and suspend modal state as closed', () => {
      const { showArchiveAndSuspendModal } = useCommentSectionModals();

      expect(showArchiveAndSuspendModal.value).toBe(false);
    });

    it('should initialize unarchive modal state as closed', () => {
      const { showUnarchiveModal } = useCommentSectionModals();

      expect(showUnarchiveModal.value).toBe(false);
    });
  });

  describe('handleClickDelete', () => {
    it('should open delete modal', () => {
      const {
        showDeleteModal,
        handleClickDelete,
      } = useCommentSectionModals();

      handleClickDelete({
        commentId: 'comment-123',
        parentCommentId: 'parent-456',
        replyCount: 5,
      });

      expect(showDeleteModal.value).toBe(true);
    });

    it('should set commentToDeleteId', () => {
      const { commentToDeleteId, handleClickDelete } = useCommentSectionModals();

      handleClickDelete({
        commentId: 'comment-123',
        parentCommentId: 'parent-456',
        replyCount: 5,
      });

      expect(commentToDeleteId.value).toBe('comment-123');
    });

    it('should set commentToDeleteReplyCount', () => {
      const { commentToDeleteReplyCount, handleClickDelete } =
        useCommentSectionModals();

      handleClickDelete({
        commentId: 'comment-123',
        parentCommentId: 'parent-456',
        replyCount: 5,
      });

      expect(commentToDeleteReplyCount.value).toBe(5);
    });

    it('should set parentOfCommentToDelete', () => {
      const { parentOfCommentToDelete, handleClickDelete } =
        useCommentSectionModals();

      handleClickDelete({
        commentId: 'comment-123',
        parentCommentId: 'parent-456',
        replyCount: 5,
      });

      expect(parentOfCommentToDelete.value).toBe('parent-456');
    });

    it('should handle root comments with empty parent', () => {
      const { parentOfCommentToDelete, handleClickDelete } =
        useCommentSectionModals();

      handleClickDelete({
        commentId: 'comment-123',
        parentCommentId: '',
        replyCount: 0,
      });

      expect(parentOfCommentToDelete.value).toBe('');
    });
  });

  describe('handleClickGiveFeedback', () => {
    it('should open feedback form modal', () => {
      const {
        showFeedbackFormModal,
        handleClickGiveFeedback,
      } = useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickGiveFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(showFeedbackFormModal.value).toBe(true);
    });

    it('should set commentToGiveFeedbackOn', () => {
      const { commentToGiveFeedbackOn, handleClickGiveFeedback } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickGiveFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(commentToGiveFeedbackOn.value).toStrictEqual(mockComment);
    });

    it('should set parentIdOfCommentToGiveFeedbackOn', () => {
      const { parentIdOfCommentToGiveFeedbackOn, handleClickGiveFeedback } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickGiveFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(parentIdOfCommentToGiveFeedbackOn.value).toBe('parent-456');
    });
  });

  describe('handleClickUndoFeedback', () => {
    it('should open confirm undo modal', () => {
      const {
        showConfirmUndoFeedbackModal,
        handleClickUndoFeedback,
      } = useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickUndoFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(showConfirmUndoFeedbackModal.value).toBe(true);
    });

    it('should set commentToRemoveFeedbackFrom', () => {
      const { commentToRemoveFeedbackFrom, handleClickUndoFeedback } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickUndoFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(commentToRemoveFeedbackFrom.value).toStrictEqual(mockComment);
    });

    it('should reuse parentIdOfCommentToGiveFeedbackOn for undo feedback', () => {
      const { parentIdOfCommentToGiveFeedbackOn, handleClickUndoFeedback } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickUndoFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(parentIdOfCommentToGiveFeedbackOn.value).toBe('parent-456');
    });
  });

  describe('handleClickEditFeedback', () => {
    it('should open edit feedback modal', () => {
      const { showEditCommentFeedbackModal, handleClickEditFeedback } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickEditFeedback({ commentData: mockComment });

      expect(showEditCommentFeedbackModal.value).toBe(true);
    });

    it('should set commentToGiveFeedbackOn during edit', () => {
      const { commentToGiveFeedbackOn, handleClickEditFeedback } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickEditFeedback({ commentData: mockComment });

      expect(commentToGiveFeedbackOn.value).toStrictEqual(mockComment);
    });
  });

  describe('disabled feedback', () => {
    const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

    it.each([
      {
        label: 'give feedback',
        openModal: () => {
          const { showFeedbackFormModal, handleClickGiveFeedback } =
            useCommentSectionModals({ feedbackEnabled: ref(false) });

          handleClickGiveFeedback({
            commentData: mockComment,
            parentCommentId: 'parent-456',
          });

          return showFeedbackFormModal.value;
        },
      },
      {
        label: 'undo feedback',
        openModal: () => {
          const { showConfirmUndoFeedbackModal, handleClickUndoFeedback } =
            useCommentSectionModals({ feedbackEnabled: ref(false) });

          handleClickUndoFeedback({
            commentData: mockComment,
            parentCommentId: 'parent-456',
          });

          return showConfirmUndoFeedbackModal.value;
        },
      },
      {
        label: 'edit feedback',
        openModal: () => {
          const { showEditCommentFeedbackModal, handleClickEditFeedback } =
            useCommentSectionModals({ feedbackEnabled: ref(false) });

          handleClickEditFeedback({ commentData: mockComment });

          return showEditCommentFeedbackModal.value;
        },
      },
    ])('does not open $label modal when feedback is disabled', ({ openModal }) => {
      expect(openModal()).toBe(false);
    });
  });

  describe('handleClickReport', () => {
    it('should open broken rules modal', () => {
      const { showBrokenRulesModal, handleClickReport } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickReport(mockComment);

      expect(showBrokenRulesModal.value).toBe(true);
    });

    it('should set comment to report', () => {
      const { commentToReport, handleClickReport } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickReport(mockComment);

      expect(commentToReport.value).toStrictEqual(mockComment);
    });
  });

  describe('handleClickArchive', () => {
    it('should open archive modal', () => {
      const { showArchiveModal, handleClickArchive } =
        useCommentSectionModals();

      handleClickArchive('comment-123');

      expect(showArchiveModal.value).toBe(true);
    });

    it('should set commentToArchiveId', () => {
      const { commentToArchiveId, handleClickArchive } =
        useCommentSectionModals();

      handleClickArchive('comment-123');

      expect(commentToArchiveId.value).toBe('comment-123');
    });
  });

  describe('handleClickArchiveAndSuspend', () => {
    it('should open archive and suspend modal', () => {
      const { showArchiveAndSuspendModal, handleClickArchiveAndSuspend } =
        useCommentSectionModals();

      handleClickArchiveAndSuspend('comment-123');

      expect(showArchiveAndSuspendModal.value).toBe(true);
    });

    it('should set commentToArchiveAndSuspendId', () => {
      const { commentToArchiveAndSuspendId, handleClickArchiveAndSuspend } =
        useCommentSectionModals();

      handleClickArchiveAndSuspend('comment-123');

      expect(commentToArchiveAndSuspendId.value).toBe('comment-123');
    });
  });

  describe('handleClickUnarchive', () => {
    it('should open unarchive modal', () => {
      const { showUnarchiveModal, handleClickUnarchive } =
        useCommentSectionModals();

      handleClickUnarchive('comment-123');

      expect(showUnarchiveModal.value).toBe(true);
    });

    it('should set commentToUnarchiveId', () => {
      const { commentToUnarchiveId, handleClickUnarchive } =
        useCommentSectionModals();

      handleClickUnarchive('comment-123');

      expect(commentToUnarchiveId.value).toBe('comment-123');
    });
  });

  describe('isolation', () => {
    it('should maintain separate state for the first composable instance', () => {
      const modals1 = useCommentSectionModals();

      modals1.handleClickArchive('comment-1');

      expect(modals1.showArchiveModal.value).toBe(true);
    });

    it('should maintain separate state for the second composable instance', () => {
      const modals1 = useCommentSectionModals();
      const modals2 = useCommentSectionModals();

      modals1.handleClickArchive('comment-1');

      expect(modals2.showArchiveModal.value).toBe(false);
    });

    it('should keep the second commentToArchiveId empty', () => {
      const modals1 = useCommentSectionModals();
      const modals2 = useCommentSectionModals();

      modals1.handleClickArchive('comment-1');

      expect(modals2.commentToArchiveId.value).toBe('');
    });
  });
});
