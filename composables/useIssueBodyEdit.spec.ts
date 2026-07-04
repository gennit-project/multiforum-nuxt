import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Issue } from '@/__generated__/graphql';
import { useIssueBodyEdit } from './useIssueBodyEdit';

type ActiveIssueRef = Parameters<typeof useIssueBodyEdit>[0]['activeIssue'];

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

describe('useIssueBodyEdit', () => {
  const updateIssueBody = vi.fn();
  const refetchIssue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    updateIssueBody.mockResolvedValue({});
    refetchIssue.mockResolvedValue({});

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: updateIssueBody,
      loading: ref(false),
      error: ref(null),
    });
  });

  it('initializes edited body from the active issue', () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    expect(bodyEdit.editedIssueBody.value).toBe('Original');
  });

  it('enters edit mode only for an unlocked issue author', () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    bodyEdit.startIssueBodyEdit();

    expect(bodyEdit.isEditingIssueBody.value).toBe(true);
  });

  it('does not enter edit mode when the issue is locked', () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(true),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    bodyEdit.startIssueBodyEdit();

    expect(bodyEdit.isEditingIssueBody.value).toBe(false);
  });

  it('tracks body changes reactively', async () => {
    const activeIssue = ref<Issue | null>({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue);
    const bodyEdit = useIssueBodyEdit({
      activeIssue: activeIssue as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    activeIssue.value = { id: 'issue-1', issueNumber: 1, body: 'Updated' } as Issue;
    await nextTick();

    expect(bodyEdit.editedIssueBody.value).toBe('Updated');
  });

  it('saves changed issue body and exits edit mode', async () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    bodyEdit.startIssueBodyEdit();
    bodyEdit.editedIssueBody.value = 'Changed';
    await bodyEdit.saveIssueBody();

    expect({
      updateCalls: updateIssueBody.mock.calls.length,
      refetchCalls: refetchIssue.mock.calls.length,
      isEditing: bodyEdit.isEditingIssueBody.value,
    }).toEqual({
      updateCalls: 1,
      refetchCalls: 1,
      isEditing: false,
    });
  });

  it('does not enter edit mode when the moderator is suspended', () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(true),
      refetchIssue,
    });

    bodyEdit.startIssueBodyEdit();

    expect(bodyEdit.isEditingIssueBody.value).toBe(false);
  });

  it('does not save the issue body when the moderator is suspended', async () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(true),
      refetchIssue,
    });

    bodyEdit.editedIssueBody.value = 'Changed';
    await bodyEdit.saveIssueBody();

    expect(updateIssueBody.mock.calls.length).toBe(0);
  });

  it('exits edit mode without saving when the body is unchanged', async () => {
    const bodyEdit = useIssueBodyEdit({
      activeIssue: ref({ id: 'issue-1', issueNumber: 1, body: 'Original' } as Issue) as ActiveIssueRef,
      activeIssueId: ref('issue-1'),
      isIssueAuthor: ref(true),
      isLocked: ref(false),
      isSuspendedMod: ref(false),
      refetchIssue,
    });

    bodyEdit.startIssueBodyEdit();
    await bodyEdit.saveIssueBody();

    expect({
      updateCalls: updateIssueBody.mock.calls.length,
      isEditing: bodyEdit.isEditingIssueBody.value,
    }).toEqual({
      updateCalls: 0,
      isEditing: false,
    });
  });
});
