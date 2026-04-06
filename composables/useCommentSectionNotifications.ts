import { ref } from 'vue';
import { useModerationOutcomeUI } from './useModerationOutcomeUI';

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

  const {
    showSuccessfullyReported,
    showSuccessfullyArchived,
    showSuccessfullyArchivedAndSuspended,
    showSuccessfullyUnarchived,
  } = useModerationOutcomeUI();

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
