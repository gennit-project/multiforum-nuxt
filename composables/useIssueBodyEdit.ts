import { ref, computed, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Ref, ComputedRef } from 'vue';
import { UPDATE_ISSUE } from '@/graphQLData/issue/mutations';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  LockedBy?: { displayName?: string };
};

type UseIssueBodyEditParams = {
  activeIssue: Ref<Issue | null> | ComputedRef<Issue | null>;
  activeIssueId: Ref<string> | ComputedRef<string>;
  isIssueAuthor: Ref<boolean> | ComputedRef<boolean>;
  isLocked: Ref<boolean> | ComputedRef<boolean>;
  refetchIssue: () => Promise<unknown> | undefined;
};

export function useIssueBodyEdit({
  activeIssue,
  activeIssueId,
  isIssueAuthor,
  isLocked,
  refetchIssue,
}: UseIssueBodyEditParams) {
  const isEditingIssueBody = ref(false);
  const editedIssueBody = ref('');

  watch(
    () => activeIssue.value?.body,
    (newBody) => {
      editedIssueBody.value = newBody || '';
    },
    { immediate: true }
  );

  const {
    mutate: updateIssueBody,
    loading: updateIssueBodyLoading,
    error: updateIssueBodyError,
  } = useMutation(UPDATE_ISSUE, () => ({
    variables: {
      issueWhere: { id: activeIssueId.value },
      updateIssueInput: { body: editedIssueBody.value },
    },
  }));

  const issueBodyHasChanges = computed(() => {
    return (editedIssueBody.value || '') !== (activeIssue.value?.body || '');
  });

  const startIssueBodyEdit = () => {
    if (!isIssueAuthor.value || isLocked.value) return;
    editedIssueBody.value = activeIssue.value?.body || '';
    isEditingIssueBody.value = true;
  };

  const cancelIssueBodyEdit = () => {
    editedIssueBody.value = activeIssue.value?.body || '';
    isEditingIssueBody.value = false;
  };

  const saveIssueBody = async () => {
    if (!activeIssue.value) return;
    if (!editedIssueBody.value.trim()) return;

    if (!issueBodyHasChanges.value) {
      isEditingIssueBody.value = false;
      return;
    }

    try {
      await updateIssueBody();
      await refetchIssue();
      isEditingIssueBody.value = false;
    } catch (error) {
      console.error('Error updating issue body', error);
    }
  };

  return {
    isEditingIssueBody,
    editedIssueBody,
    updateIssueBodyLoading,
    updateIssueBodyError,
    issueBodyHasChanges,
    startIssueBodyEdit,
    cancelIssueBodyEdit,
    saveIssueBody,
  };
}
