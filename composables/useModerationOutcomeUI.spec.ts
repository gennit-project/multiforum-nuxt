import { describe, expect, it } from 'vitest';
import { useModerationOutcomeUI } from './useModerationOutcomeUI';

describe('useModerationOutcomeUI', () => {
  it('opens the report modal', () => {
    const state = useModerationOutcomeUI();

    state.openReportModal();

    expect(state.showReportModal.value).toBe(true);
  });

  it('marks report success and closes the report modal', () => {
    const state = useModerationOutcomeUI();
    state.openReportModal();

    state.handleReportedSuccessfully();

    expect(state.showSuccessfullyReported.value).toBe(true);
  });

  it('marks archive success and closes the archive modal', () => {
    const state = useModerationOutcomeUI();
    state.openArchiveModal();

    state.handleArchivedSuccessfully();

    expect(state.showSuccessfullyArchived.value).toBe(true);
  });

  it('marks unarchive success and closes the unarchive modal', () => {
    const state = useModerationOutcomeUI();
    state.openUnarchiveModal();

    state.handleUnarchivedSuccessfully();

    expect(state.showSuccessfullyUnarchived.value).toBe(true);
  });

  it('marks archive-and-suspend success and closes that modal', () => {
    const state = useModerationOutcomeUI();
    state.openArchiveAndSuspendModal();

    state.handleArchivedAndSuspendedSuccessfully();

    expect(state.showSuccessfullyArchivedAndSuspended.value).toBe(true);
  });
});
