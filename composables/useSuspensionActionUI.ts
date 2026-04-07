import { ref } from 'vue';

type UseSuspensionActionUIOptions = {
  isDisabled?: () => boolean;
};

export const useSuspensionActionUI = (
  options: UseSuspensionActionUIOptions = {}
) => {
  const isDisabled = options.isDisabled ?? (() => false);

  const showSuspendModal = ref(false);
  const showUnsuspendModal = ref(false);
  const showSuccessfullySuspended = ref(false);
  const showSuccessfullyUnsuspended = ref(false);

  const openSuspendModal = () => {
    if (isDisabled()) return;
    showSuspendModal.value = true;
  };

  const openUnsuspendModal = () => {
    if (isDisabled()) return;
    showUnsuspendModal.value = true;
  };

  const closeSuspendModal = () => {
    showSuspendModal.value = false;
  };

  const closeUnsuspendModal = () => {
    showUnsuspendModal.value = false;
  };

  const handleSuspendedSuccessfully = () => {
    showSuccessfullySuspended.value = true;
    showSuspendModal.value = false;
  };

  const handleUnsuspendedSuccessfully = () => {
    showSuccessfullyUnsuspended.value = true;
    showUnsuspendModal.value = false;
  };

  const dismissSuspendedNotification = () => {
    showSuccessfullySuspended.value = false;
  };

  const dismissUnsuspendedNotification = () => {
    showSuccessfullyUnsuspended.value = false;
  };

  return {
    showSuspendModal,
    showUnsuspendModal,
    showSuccessfullySuspended,
    showSuccessfullyUnsuspended,
    openSuspendModal,
    openUnsuspendModal,
    closeSuspendModal,
    closeUnsuspendModal,
    handleSuspendedSuccessfully,
    handleUnsuspendedSuccessfully,
    dismissSuspendedNotification,
    dismissUnsuspendedNotification,
  };
};
