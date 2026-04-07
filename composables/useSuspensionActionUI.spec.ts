import { describe, expect, it } from 'vitest';
import { useSuspensionActionUI } from './useSuspensionActionUI';

describe('useSuspensionActionUI', () => {
  it('opens the suspend modal when actions are enabled', () => {
    const state = useSuspensionActionUI();

    state.openSuspendModal();

    expect(state.showSuspendModal.value).toBe(true);
  });

  it('does not open the suspend modal when actions are disabled', () => {
    const state = useSuspensionActionUI({
      isDisabled: () => true,
    });

    state.openSuspendModal();

    expect(state.showSuspendModal.value).toBe(false);
  });

  it('marks suspend success and closes the suspend modal', () => {
    const state = useSuspensionActionUI();
    state.openSuspendModal();

    state.handleSuspendedSuccessfully();

    expect(state.showSuccessfullySuspended.value).toBe(true);
  });

  it('marks unsuspend success and closes the unsuspend modal', () => {
    const state = useSuspensionActionUI();
    state.openUnsuspendModal();

    state.handleUnsuspendedSuccessfully();

    expect(state.showSuccessfullyUnsuspended.value).toBe(true);
  });
});
