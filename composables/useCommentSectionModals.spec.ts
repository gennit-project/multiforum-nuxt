import { describe, it, expect } from 'vitest';
import { useCommentSectionModals } from './useCommentSectionModals';
import type { Comment } from '@/__generated__/graphql';

describe('useCommentSectionModals', () => {
  describe('initial state', () => {
    it('should initialize delete modal state as closed with empty values', () => {
      const { showDeleteModal, commentToDeleteId, commentToDeleteReplyCount } =
        useCommentSectionModals();

      expect(showDeleteModal.value).toBe(false);
      expect(commentToDeleteId.value).toBe('');
      expect(commentToDeleteReplyCount.value).toBe(0);
    });

    it('should initialize feedback modal state as closed', () => {
      const {
        showFeedbackFormModal,
        showConfirmUndoFeedbackModal,
        showEditCommentFeedbackModal,
      } = useCommentSectionModals();

      expect(showFeedbackFormModal.value).toBe(false);
      expect(showConfirmUndoFeedbackModal.value).toBe(false);
      expect(showEditCommentFeedbackModal.value).toBe(false);
    });

    it('should initialize report modal state as closed', () => {
      const { showBrokenRulesModal, commentToReport } =
        useCommentSectionModals();

      expect(showBrokenRulesModal.value).toBe(false);
      expect(commentToReport.value).toBe(null);
    });

    it('should initialize archive modal state as closed', () => {
      const {
        showArchiveModal,
        showArchiveAndSuspendModal,
        showUnarchiveModal,
      } = useCommentSectionModals();

      expect(showArchiveModal.value).toBe(false);
      expect(showArchiveAndSuspendModal.value).toBe(false);
      expect(showUnarchiveModal.value).toBe(false);
    });
  });

  describe('handleClickDelete', () => {
    it('should open delete modal and set comment data', () => {
      const {
        showDeleteModal,
        commentToDeleteId,
        commentToDeleteReplyCount,
        parentOfCommentToDelete,
        handleClickDelete,
      } = useCommentSectionModals();

      handleClickDelete({
        commentId: 'comment-123',
        parentCommentId: 'parent-456',
        replyCount: 5,
      });

      expect(showDeleteModal.value).toBe(true);
      expect(commentToDeleteId.value).toBe('comment-123');
      expect(commentToDeleteReplyCount.value).toBe(5);
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
    it('should open feedback form modal and set comment data', () => {
      const {
        showFeedbackFormModal,
        commentToGiveFeedbackOn,
        parentIdOfCommentToGiveFeedbackOn,
        handleClickGiveFeedback,
      } = useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickGiveFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(showFeedbackFormModal.value).toBe(true);
      expect(commentToGiveFeedbackOn.value).toStrictEqual(mockComment);
      expect(parentIdOfCommentToGiveFeedbackOn.value).toBe('parent-456');
    });
  });

  describe('handleClickUndoFeedback', () => {
    it('should open confirm undo modal and set comment data', () => {
      const {
        showConfirmUndoFeedbackModal,
        commentToRemoveFeedbackFrom,
        parentIdOfCommentToGiveFeedbackOn,
        handleClickUndoFeedback,
      } = useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickUndoFeedback({
        commentData: mockComment,
        parentCommentId: 'parent-456',
      });

      expect(showConfirmUndoFeedbackModal.value).toBe(true);
      expect(commentToRemoveFeedbackFrom.value).toStrictEqual(mockComment);
      expect(parentIdOfCommentToGiveFeedbackOn.value).toBe('parent-456');
    });
  });

  describe('handleClickEditFeedback', () => {
    it('should open edit feedback modal and set comment data', () => {
      const {
        showEditCommentFeedbackModal,
        commentToGiveFeedbackOn,
        handleClickEditFeedback,
      } = useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickEditFeedback({ commentData: mockComment });

      expect(showEditCommentFeedbackModal.value).toBe(true);
      expect(commentToGiveFeedbackOn.value).toStrictEqual(mockComment);
    });
  });

  describe('handleClickReport', () => {
    it('should open broken rules modal and set comment to report', () => {
      const { showBrokenRulesModal, commentToReport, handleClickReport } =
        useCommentSectionModals();

      const mockComment = { id: 'comment-123', text: 'Test' } as Comment;

      handleClickReport(mockComment);

      expect(showBrokenRulesModal.value).toBe(true);
      expect(commentToReport.value).toStrictEqual(mockComment);
    });
  });

  describe('handleClickArchive', () => {
    it('should open archive modal and set comment ID', () => {
      const { showArchiveModal, commentToArchiveId, handleClickArchive } =
        useCommentSectionModals();

      handleClickArchive('comment-123');

      expect(showArchiveModal.value).toBe(true);
      expect(commentToArchiveId.value).toBe('comment-123');
    });
  });

  describe('handleClickArchiveAndSuspend', () => {
    it('should open archive and suspend modal and set comment ID', () => {
      const {
        showArchiveAndSuspendModal,
        commentToArchiveAndSuspendId,
        handleClickArchiveAndSuspend,
      } = useCommentSectionModals();

      handleClickArchiveAndSuspend('comment-123');

      expect(showArchiveAndSuspendModal.value).toBe(true);
      expect(commentToArchiveAndSuspendId.value).toBe('comment-123');
    });
  });

  describe('handleClickUnarchive', () => {
    it('should open unarchive modal and set comment ID', () => {
      const { showUnarchiveModal, commentToUnarchiveId, handleClickUnarchive } =
        useCommentSectionModals();

      handleClickUnarchive('comment-123');

      expect(showUnarchiveModal.value).toBe(true);
      expect(commentToUnarchiveId.value).toBe('comment-123');
    });
  });

  describe('isolation', () => {
    it('should maintain separate state for each composable instance', () => {
      const modals1 = useCommentSectionModals();
      const modals2 = useCommentSectionModals();

      modals1.handleClickArchive('comment-1');

      expect(modals1.showArchiveModal.value).toBe(true);
      expect(modals1.commentToArchiveId.value).toBe('comment-1');
      expect(modals2.showArchiveModal.value).toBe(false);
      expect(modals2.commentToArchiveId.value).toBe('');
    });
  });
});
