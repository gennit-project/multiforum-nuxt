import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useIssueLock } from './useIssueLock';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

describe('useIssueLock', () => {
  const lockMutation = vi.fn();
  const unlockMutation = vi.fn();
  const refetchIssue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    lockMutation.mockResolvedValue({});
    unlockMutation.mockResolvedValue({});
    refetchIssue.mockResolvedValue({});

    (useMutation as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        mutate: lockMutation,
        loading: ref(false),
        error: ref(null),
      })
      .mockReturnValueOnce({
        mutate: unlockMutation,
        loading: ref(false),
        error: ref(null),
      });
  });

  it('opens and closes the lock dialog while clearing the reason', () => {
    const issueLock = useIssueLock({
      activeIssueId: ref('issue-1'),
      activeIssue: ref({ id: 'issue-1', issueNumber: 1 } as any),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    issueLock.lockReasonInput.value = 'Needs review';
    issueLock.openLockDialog();
    issueLock.lockReasonInput.value = 'Spam';
    issueLock.closeLockDialog();

    expect({
      showLockDialog: issueLock.showLockDialog.value,
      lockReasonInput: issueLock.lockReasonInput.value,
    }).toEqual({
      showLockDialog: false,
      lockReasonInput: '',
    });
  });

  it('locks an active issue and refetches it', async () => {
    const issueLock = useIssueLock({
      activeIssueId: ref('issue-1'),
      activeIssue: ref({ id: 'issue-1', issueNumber: 1 } as any),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    issueLock.lockReasonInput.value = 'Spam';
    issueLock.showLockDialog.value = true;
    await issueLock.handleLockIssue();

    expect({
      lockMutationCalls: lockMutation.mock.calls.length,
      refetchCalls: refetchIssue.mock.calls.length,
      showLockDialog: issueLock.showLockDialog.value,
      lockReasonInput: issueLock.lockReasonInput.value,
    }).toEqual({
      lockMutationCalls: 1,
      refetchCalls: 1,
      showLockDialog: false,
      lockReasonInput: '',
    });
  });

  it('does not lock when the mod is suspended', async () => {
    const issueLock = useIssueLock({
      activeIssueId: ref('issue-1'),
      activeIssue: ref({ id: 'issue-1', issueNumber: 1 } as any),
      isSuspendedMod: ref(true),
      refetchIssue,
    });

    issueLock.lockReasonInput.value = 'Spam';
    await issueLock.handleLockIssue();

    expect(lockMutation).not.toHaveBeenCalled();
  });

  it('unlocks an active issue and refetches it', async () => {
    const issueLock = useIssueLock({
      activeIssueId: ref('issue-1'),
      activeIssue: ref({ id: 'issue-1', issueNumber: 1 } as any),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    await issueLock.handleUnlockIssue();

    expect({
      unlockMutationCalls: unlockMutation.mock.calls.length,
      refetchCalls: refetchIssue.mock.calls.length,
    }).toEqual({
      unlockMutationCalls: 1,
      refetchCalls: 1,
    });
  });
});
