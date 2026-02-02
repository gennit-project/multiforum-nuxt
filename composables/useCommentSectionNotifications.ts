import { ref } from 'vue';

/**
 * Composable that manages notification state for the comment section.
 * Provides refs for various notification visibility states.
 *
 * @returns Object with notification visibility refs
 */
export function useCommentSectionNotifications() {
  // Clipboard notification
  const showCopiedLinkNotification = ref(false);

  // Best answer notifications
  const showMarkedAsBestAnswerNotification = ref(false);
  const showUnmarkedAsBestAnswerNotification = ref(false);

  // Feedback notification
  const showFeedbackSubmittedSuccessfully = ref(false);

  // Report notification
  const showSuccessfullyReported = ref(false);

  // Archive notifications
  const showSuccessfullyArchived = ref(false);
  const showSuccessfullyArchivedAndSuspended = ref(false);
  const showSuccessfullyUnarchived = ref(false);

  return {
    showCopiedLinkNotification,
    showMarkedAsBestAnswerNotification,
    showUnmarkedAsBestAnswerNotification,
    showFeedbackSubmittedSuccessfully,
    showSuccessfullyReported,
    showSuccessfullyArchived,
    showSuccessfullyArchivedAndSuspended,
    showSuccessfullyUnarchived,
  };
}
