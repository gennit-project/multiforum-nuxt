import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useIssueModerationActions } from './useIssueModerationActions';

const addAsUser = vi.fn();
const addAsMod = vi.fn();
const addItem = vi.fn();
const closeIssue = vi.fn();
const reopenIssue = vi.fn();
const resetActivityFeed = vi.fn();
const refetchChannel = vi.fn();
const deleteDiscussion = vi.fn();
const deleteEvent = vi.fn();
const deleteComment = vi.fn();
let useMutationCall = 0;

vi.mock('@vue/apollo-composable', () => ({
  // Composable calls useMutation for DELETE_DISCUSSION, DELETE_EVENT,
  // DELETE_COMMENT in that order.
  useMutation: () => {
    useMutationCall += 1;
    const mutate =
      [deleteDiscussion, deleteEvent, deleteComment][useMutationCall - 1] ??
      vi.fn();
    return { mutate };
  },
}));

type SetupOpts = {
  activeIssue?: unknown;
  username?: string;
  modProfileName?: string;
  isSuspendedMod?: boolean;
  isOriginalUserAuthor?: boolean;
  isOriginalModAuthor?: boolean;
  isCurrentUserOriginalPoster?: boolean;
};

const setup = (o: SetupOpts = {}) =>
  useIssueModerationActions({
    activeIssue: ref(
      o.activeIssue === undefined ? { id: 'issue-1', isOpen: true } : o.activeIssue
    ) as never,
    channelId: ref('cats'),
    username: ref(o.username ?? 'alice'),
    modProfileName: ref(o.modProfileName ?? 'mod-zoe'),
    isSuspendedMod: ref(o.isSuspendedMod ?? false),
    isOriginalUserAuthor: ref(o.isOriginalUserAuthor ?? false),
    isOriginalModAuthor: ref(o.isOriginalModAuthor ?? false),
    isCurrentUserOriginalPoster: ref(o.isCurrentUserOriginalPoster ?? false),
    closeIssue,
    reopenIssue,
    addIssueActivityFeedItem: addItem,
    addIssueActivityFeedItemWithCommentAsMod: addAsMod,
    addIssueActivityFeedItemWithCommentAsUser: addAsUser,
    resetActivityFeed,
    refetchChannel,
  });

beforeEach(() => {
  useMutationCall = 0;
  for (const fn of [
    addAsUser,
    addAsMod,
    addItem,
    closeIssue,
    reopenIssue,
    resetActivityFeed,
    refetchChannel,
    deleteDiscussion,
    deleteEvent,
    deleteComment,
  ]) {
    fn.mockReset().mockResolvedValue(undefined);
  }
});

describe('useIssueModerationActions — comment form', () => {
  it('updates the comment text', () => {
    const { updateComment, createFormValues } = setup();

    updateComment('hello there');

    expect(createFormValues.value.text).toBe('hello there');
  });
});

describe('useIssueModerationActions — create comment', () => {
  it('does nothing when there is no active issue', async () => {
    const { handleCreateComment } = setup({ activeIssue: null });

    await handleCreateComment();

    expect(resetActivityFeed).not.toHaveBeenCalled();
  });

  it('blocks a suspended mod who is not the original user author', async () => {
    const { handleCreateComment } = setup({
      isSuspendedMod: true,
      isOriginalUserAuthor: false,
    });

    await handleCreateComment();

    expect(addAsMod).not.toHaveBeenCalled();
  });

  it('comments as the original user when they authored as a user', async () => {
    const { handleCreateComment } = setup({ isOriginalUserAuthor: true });

    await handleCreateComment();

    expect(addAsUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice', actionType: 'comment' })
    );
  });

  it('comments as a mod when the user is the original mod author', async () => {
    const { handleCreateComment } = setup({ isOriginalModAuthor: true });

    await handleCreateComment();

    expect(addAsMod).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'mod-zoe', actionType: 'comment' })
    );
  });

  it('comments as a mod when the user is a third-party moderator', async () => {
    const { handleCreateComment } = setup();

    await handleCreateComment();

    expect(addAsMod).toHaveBeenCalledTimes(1);
  });

  it('aborts the mod-author path when the mod profile name is missing', async () => {
    const { handleCreateComment } = setup({
      isOriginalModAuthor: true,
      modProfileName: '',
    });

    await handleCreateComment();

    expect(addAsMod).not.toHaveBeenCalled();
  });

  it('refreshes the feed after a successful comment', async () => {
    const { handleCreateComment } = setup({ isOriginalUserAuthor: true });

    await handleCreateComment();

    expect(resetActivityFeed).toHaveBeenCalledTimes(1);
  });
});

describe('useIssueModerationActions — toggle open/close', () => {
  it('does nothing without a mod profile name', async () => {
    const { toggleCloseOpenIssue } = setup({ modProfileName: '' });

    await toggleCloseOpenIssue();

    expect(closeIssue).not.toHaveBeenCalled();
  });

  it('does nothing for a suspended mod', async () => {
    const { toggleCloseOpenIssue } = setup({ isSuspendedMod: true });

    await toggleCloseOpenIssue();

    expect(closeIssue).not.toHaveBeenCalled();
  });

  it('closes an open issue', async () => {
    const { toggleCloseOpenIssue } = setup({
      activeIssue: { id: 'issue-1', isOpen: true },
    });

    await toggleCloseOpenIssue();

    expect(closeIssue).toHaveBeenCalledTimes(1);
  });

  it('logs a plain close action when there is no comment', async () => {
    const { toggleCloseOpenIssue } = setup({
      activeIssue: { id: 'issue-1', isOpen: true },
    });

    await toggleCloseOpenIssue();

    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'close' })
    );
  });

  it('logs a close-with-comment action when a comment is present', async () => {
    const { toggleCloseOpenIssue, updateComment } = setup({
      activeIssue: { id: 'issue-1', isOpen: true },
    });
    updateComment('closing this');

    await toggleCloseOpenIssue();

    expect(addAsMod).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'close', commentText: 'closing this' })
    );
  });

  it('reopens a closed issue', async () => {
    const { toggleCloseOpenIssue } = setup({
      activeIssue: { id: 'issue-1', isOpen: false },
    });

    await toggleCloseOpenIssue();

    expect(reopenIssue).toHaveBeenCalledTimes(1);
  });

  it('refetches channel counts after toggling', async () => {
    const { toggleCloseOpenIssue } = setup({
      activeIssue: { id: 'issue-1', isOpen: true },
    });

    await toggleCloseOpenIssue();

    expect(refetchChannel).toHaveBeenCalledTimes(1);
  });
});

describe('useIssueModerationActions — delete related content', () => {
  it('does nothing without an id', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
    });

    await handleDeleteRelatedContent('discussion', '');

    expect(deleteDiscussion).not.toHaveBeenCalled();
  });

  it('requires a reason from a non-original-poster', async () => {
    const { handleDeleteRelatedContent, deleteReasonError } = setup({
      isCurrentUserOriginalPoster: false,
    });

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(deleteReasonError.value).toBe(
      'Please provide a reason before deleting.'
    );
  });

  it('does not delete when the required reason is missing', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: false,
    });

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(deleteDiscussion).not.toHaveBeenCalled();
  });

  it('deletes a discussion for the original poster without a reason', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
    });

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(deleteDiscussion).toHaveBeenCalledWith({ id: 'd1' });
  });

  it('deletes an event', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
    });

    await handleDeleteRelatedContent('event', 'e1');

    expect(deleteEvent).toHaveBeenCalledWith({ id: 'e1' });
  });

  it('deletes a comment', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
    });

    await handleDeleteRelatedContent('comment', 'c1');

    expect(deleteComment).toHaveBeenCalledWith({ id: 'c1' });
  });

  it('closes an open issue before deleting when acting as a mod', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
      activeIssue: { id: 'issue-1', isOpen: true },
    });

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(closeIssue).toHaveBeenCalledTimes(1);
  });

  it('logs the delete action with the matching label', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
    });

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(addAsMod).toHaveBeenCalledWith(
      expect.objectContaining({
        actionDescription: 'deleted the discussion',
        actionType: 'delete',
      })
    );
  });

  it('uses the typed reason as the delete comment text', async () => {
    const { handleDeleteRelatedContent, updateComment } = setup({
      isCurrentUserOriginalPoster: true,
    });
    updateComment('spam content');

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(addAsMod).toHaveBeenCalledWith(
      expect.objectContaining({ commentText: 'spam content' })
    );
  });

  it('falls back to a default reason when no text is provided', async () => {
    const { handleDeleteRelatedContent } = setup({
      isCurrentUserOriginalPoster: true,
    });

    await handleDeleteRelatedContent('discussion', 'd1');

    expect(addAsMod).toHaveBeenCalledWith(
      expect.objectContaining({ commentText: 'No reason provided.' })
    );
  });
});
