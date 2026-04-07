import { ref } from 'vue';

export const useModerationOutcomeUI = () => {
  const showReportModal = ref(false);
  const showArchiveModal = ref(false);
  const showUnarchiveModal = ref(false);
  const showArchiveAndSuspendModal = ref(false);

  const showSuccessfullyReported = ref(false);
  const showSuccessfullyArchived = ref(false);
  const showSuccessfullyUnarchived = ref(false);
  const showSuccessfullyArchivedAndSuspended = ref(false);

  const openReportModal = () => {
    showReportModal.value = true;
  };

  const closeReportModal = () => {
    showReportModal.value = false;
  };

  const openArchiveModal = () => {
    showArchiveModal.value = true;
  };

  const closeArchiveModal = () => {
    showArchiveModal.value = false;
  };

  const openUnarchiveModal = () => {
    showUnarchiveModal.value = true;
  };

  const closeUnarchiveModal = () => {
    showUnarchiveModal.value = false;
  };

  const openArchiveAndSuspendModal = () => {
    showArchiveAndSuspendModal.value = true;
  };

  const closeArchiveAndSuspendModal = () => {
    showArchiveAndSuspendModal.value = false;
  };

  const handleReportedSuccessfully = () => {
    showSuccessfullyReported.value = true;
    showReportModal.value = false;
  };

  const handleArchivedSuccessfully = () => {
    showSuccessfullyArchived.value = true;
    showArchiveModal.value = false;
  };

  const handleUnarchivedSuccessfully = () => {
    showSuccessfullyUnarchived.value = true;
    showUnarchiveModal.value = false;
  };

  const handleArchivedAndSuspendedSuccessfully = () => {
    showSuccessfullyArchivedAndSuspended.value = true;
    showArchiveAndSuspendModal.value = false;
  };

  const dismissReportedNotification = () => {
    showSuccessfullyReported.value = false;
  };

  const dismissArchivedNotification = () => {
    showSuccessfullyArchived.value = false;
  };

  const dismissUnarchivedNotification = () => {
    showSuccessfullyUnarchived.value = false;
  };

  const dismissArchivedAndSuspendedNotification = () => {
    showSuccessfullyArchivedAndSuspended.value = false;
  };

  return {
    showReportModal,
    showArchiveModal,
    showUnarchiveModal,
    showArchiveAndSuspendModal,
    showSuccessfullyReported,
    showSuccessfullyArchived,
    showSuccessfullyUnarchived,
    showSuccessfullyArchivedAndSuspended,
    openReportModal,
    closeReportModal,
    openArchiveModal,
    closeArchiveModal,
    openUnarchiveModal,
    closeUnarchiveModal,
    openArchiveAndSuspendModal,
    closeArchiveAndSuspendModal,
    handleReportedSuccessfully,
    handleArchivedSuccessfully,
    handleUnarchivedSuccessfully,
    handleArchivedAndSuspendedSuccessfully,
    dismissReportedNotification,
    dismissArchivedNotification,
    dismissUnarchivedNotification,
    dismissArchivedAndSuspendedNotification,
  };
};
