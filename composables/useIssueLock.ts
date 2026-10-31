import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Ref, ComputedRef } from 'vue';
import { LockIssueDocument as LOCK_ISSUE, UnlockIssueDocument as UNLOCK_ISSUE } from '@/__generated__/operations';
import type { IssueView as Issue } from '@/types/Issue';

type UseIssueLockParams = {
  activeIssueId: Ref<string> | ComputedRef<string>;
  activeIssue: Ref<Pick<Issue, 'id'> | null> | ComputedRef<Pick<Issue, 'id'> | null>;
  isSuspendedMod: Ref<boolean> | ComputedRef<boolean | undefined>;
  refetchIssue: () => Promise<unknown> | undefined;
};

export function useIssueLock({
  activeIssueId,
  activeIssue,
  isSuspendedMod,
  refetchIssue,
}: UseIssueLockParams) {
  const lockReasonInput = ref('');
  const showLockDialog = ref(false);

  const {
    mutate: lockIssueMutation,
    loading: lockIssueLoading,
    error: lockIssueError,
  } = useMutation(LOCK_ISSUE, () => ({
    variables: {
      issueId: activeIssueId.value,
      reason: lockReasonInput.value,
    },
  }));

  const {
    mutate: unlockIssueMutation,
    loading: unlockIssueLoading,
    error: unlockIssueError,
  } = useMutation(UNLOCK_ISSUE, () => ({
    variables: {
      issueId: activeIssueId.value,
      reason: null,
    },
  }));

  const handleLockIssue = async () => {
    if (!activeIssue.value || !lockReasonInput.value.trim()) return;
    if (isSuspendedMod.value) return;

    try {
      await lockIssueMutation();
      await refetchIssue();
      showLockDialog.value = false;
      lockReasonInput.value = '';
    } catch (error) {
      console.error('Error locking issue:', error);
    }
  };

  const handleUnlockIssue = async () => {
    if (!activeIssue.value) return;
    if (isSuspendedMod.value) return;

    try {
      await unlockIssueMutation();
      await refetchIssue();
    } catch (error) {
      console.error('Error unlocking issue:', error);
    }
  };

  const openLockDialog = () => {
    lockReasonInput.value = '';
    showLockDialog.value = true;
  };

  const closeLockDialog = () => {
    showLockDialog.value = false;
    lockReasonInput.value = '';
  };

  return {
    lockReasonInput,
    showLockDialog,
    lockIssueLoading,
    lockIssueError,
    unlockIssueLoading,
    unlockIssueError,
    handleLockIssue,
    handleUnlockIssue,
    openLockDialog,
    closeLockDialog,
  };
}
