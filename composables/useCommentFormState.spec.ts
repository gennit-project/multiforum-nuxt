import { describe, it, expect } from 'vitest';
import { useCommentFormState } from './useCommentFormState';
import type { Comment } from '@/__generated__/graphql';

const comment = (overrides: Record<string, unknown> = {}): Comment =>
  ({ id: 'c1', text: 'hello', __typename: 'Comment', ...overrides }) as unknown as Comment;

describe('useCommentFormState', () => {
  it('opens the reply editor and closes any open edit editor', () => {
    const s = useCommentFormState();
    s.editFormOpenAtCommentID.value = 'c9';
    s.openReplyEditor('c1');
    expect([s.replyFormOpenAtCommentID.value, s.editFormOpenAtCommentID.value]).toEqual(
      ['c1', '']
    );
  });

  it('hides the reply editor', () => {
    const s = useCommentFormState();
    s.replyFormOpenAtCommentID.value = 'c1';
    s.hideReplyEditor();
    expect(s.replyFormOpenAtCommentID.value).toBe('');
  });

  it('opens the edit editor and closes any open reply editor', () => {
    const s = useCommentFormState();
    s.replyFormOpenAtCommentID.value = 'c9';
    s.openEditCommentEditor('c1');
    expect([s.editFormOpenAtCommentID.value, s.replyFormOpenAtCommentID.value]).toEqual(
      ['c1', '']
    );
  });

  it('hides the edit editor and clears the edited comment', () => {
    const s = useCommentFormState();
    s.startEditing(comment());
    s.hideEditCommentEditor();
    expect([s.editFormOpenAtCommentID.value, s.commentToEdit.value]).toEqual(['', null]);
  });

  it('starts editing a root comment', () => {
    const s = useCommentFormState();
    s.startEditing(comment({ id: 'c1', text: 'root text', ParentComment: null }));
    expect({
      editing: s.commentToEdit.value?.id,
      open: s.editFormOpenAtCommentID.value,
      form: s.editFormValues.value,
    }).toEqual({
      editing: 'c1',
      open: 'c1',
      form: { text: 'root text', isRootComment: true, depth: 1 },
    });
  });

  it('marks a reply (has ParentComment) as a non-root comment when editing', () => {
    const s = useCommentFormState();
    s.startEditing(comment({ ParentComment: { id: 'p1' } }));
    expect(s.editFormValues.value.isRootComment).toBe(false);
  });

  it('defaults the edit text to empty when the comment has none', () => {
    const s = useCommentFormState();
    s.startEditing(comment({ text: null }));
    expect(s.editFormValues.value.text).toBe('');
  });

  it('merges text and isRootComment into the edit form values', () => {
    const s = useCommentFormState();
    s.updateEditInputValues('edited', false);
    expect(s.editFormValues.value).toMatchObject({ text: 'edited', isRootComment: false });
  });

  it('updates just the feedback text', () => {
    const s = useCommentFormState();
    s.updateFeedbackText('feedback');
    expect(s.editFormValues.value.text).toBe('feedback');
  });

  it('resets create-related state after a successful create', () => {
    const s = useCommentFormState();
    s.commentInProcess.value = true;
    s.submitAttempted.value = true;
    s.replyFormOpenAtCommentID.value = 'c1';
    s.resetAfterCreate();
    expect([
      s.commentInProcess.value,
      s.submitAttempted.value,
      s.replyFormOpenAtCommentID.value,
    ]).toEqual([false, false, '']);
  });

  it('resets edit-related state after a successful update', () => {
    const s = useCommentFormState();
    s.startEditing(comment());
    s.commentInProcess.value = true;
    s.resetAfterUpdate();
    expect({
      inProcess: s.commentInProcess.value,
      open: s.editFormOpenAtCommentID.value,
      editing: s.commentToEdit.value,
      form: s.editFormValues.value,
    }).toEqual({
      inProcess: false,
      open: '',
      editing: null,
      form: { text: '', isRootComment: true, depth: 1 },
    });
  });
});
