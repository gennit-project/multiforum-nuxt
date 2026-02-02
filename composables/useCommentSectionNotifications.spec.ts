import { describe, it, expect } from 'vitest';
import { useCommentSectionNotifications } from './useCommentSectionNotifications';

describe('useCommentSectionNotifications', () => {
  describe('initial state', () => {
    it('should initialize showCopiedLinkNotification as false', () => {
      const { showCopiedLinkNotification } = useCommentSectionNotifications();
      expect(showCopiedLinkNotification.value).toBe(false);
    });

    it('should initialize showMarkedAsBestAnswerNotification as false', () => {
      const { showMarkedAsBestAnswerNotification } =
        useCommentSectionNotifications();
      expect(showMarkedAsBestAnswerNotification.value).toBe(false);
    });

    it('should initialize showUnmarkedAsBestAnswerNotification as false', () => {
      const { showUnmarkedAsBestAnswerNotification } =
        useCommentSectionNotifications();
      expect(showUnmarkedAsBestAnswerNotification.value).toBe(false);
    });

    it('should initialize showFeedbackSubmittedSuccessfully as false', () => {
      const { showFeedbackSubmittedSuccessfully } =
        useCommentSectionNotifications();
      expect(showFeedbackSubmittedSuccessfully.value).toBe(false);
    });

    it('should initialize showSuccessfullyReported as false', () => {
      const { showSuccessfullyReported } = useCommentSectionNotifications();
      expect(showSuccessfullyReported.value).toBe(false);
    });

    it('should initialize showSuccessfullyArchived as false', () => {
      const { showSuccessfullyArchived } = useCommentSectionNotifications();
      expect(showSuccessfullyArchived.value).toBe(false);
    });

    it('should initialize showSuccessfullyArchivedAndSuspended as false', () => {
      const { showSuccessfullyArchivedAndSuspended } =
        useCommentSectionNotifications();
      expect(showSuccessfullyArchivedAndSuspended.value).toBe(false);
    });

    it('should initialize showSuccessfullyUnarchived as false', () => {
      const { showSuccessfullyUnarchived } = useCommentSectionNotifications();
      expect(showSuccessfullyUnarchived.value).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('should allow setting notification values', () => {
      const { showCopiedLinkNotification, showSuccessfullyReported } =
        useCommentSectionNotifications();

      showCopiedLinkNotification.value = true;
      showSuccessfullyReported.value = true;

      expect(showCopiedLinkNotification.value).toBe(true);
      expect(showSuccessfullyReported.value).toBe(true);
    });

    it('should maintain separate state for each call', () => {
      const notifications1 = useCommentSectionNotifications();
      const notifications2 = useCommentSectionNotifications();

      notifications1.showCopiedLinkNotification.value = true;

      expect(notifications1.showCopiedLinkNotification.value).toBe(true);
      expect(notifications2.showCopiedLinkNotification.value).toBe(false);
    });
  });
});
