import { ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { DELETE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import { DELETE_EVENT } from '@/graphQLData/event/mutations';
import { DELETE_COMMENT } from '@/graphQLData/comment/mutations';

type MaybeRef<T> = Ref<T> | ComputedRef<T>;
type AsyncFn = () => Promise<unknown> | undefined;

type AddFeedItem = (args: {
  issueId: string;
  displayName: string;
  actionDescription: string;
  actionType: string;
}) => Promise<unknown> | undefined;

type AddFeedItemWithComment = (args: {
  issueId: string;
  commentText: string;
  username?: string;
  displayName?: string;
  actionDescription: string;
  actionType: string;
  channelUniqueName: string;
}) => Promise<unknown> | undefined;

type IssueLike = {
  id: string;
  isOpen?: boolean | null;
} | null;

type UseIssueModerationActionsParams = {
  activeIssue: MaybeRef<IssueLike>;
  channelId: MaybeRef<string>;
  username: MaybeRef<string>;
  modProfileName: MaybeRef<string>;
  isSuspendedMod: MaybeRef<boolean>;
  isOriginalUserAuthor: MaybeRef<boolean>;
  isOriginalModAuthor: MaybeRef<boolean>;
  isCurrentUserOriginalPoster: MaybeRef<boolean>;
  closeIssue: AsyncFn;
  reopenIssue: AsyncFn;
  addIssueActivityFeedItem: AddFeedItem;
  addIssueActivityFeedItemWithCommentAsMod: AddFeedItemWithComment;
  addIssueActivityFeedItemWithCommentAsUser: AddFeedItemWithComment;
  resetActivityFeed: AsyncFn;
  refetchChannel: AsyncFn;
};

/**
 * The issue moderation "command" hub: posting comments (as the original user,
 * as the original mod, or as a third-party mod), toggling open/close with an
 * optional comment, and deleting the reported discussion/event/comment. Owns
 * the comment form state + delete mutations and depends on the sibling
 * composables' actions, so the branchy author/suspension/OP logic is testable
 * without mounting IssueDetail.vue.
 */
export function useIssueModerationActions({
  activeIssue,
  channelId,
  username,
  modProfileName,
  isSuspendedMod,
  isOriginalUserAuthor,
  isOriginalModAuthor,
  isCurrentUserOriginalPoster,
  closeIssue,
  reopenIssue,
  addIssueActivityFeedItem,
  addIssueActivityFeedItemWithCommentAsMod,
  addIssueActivityFeedItemWithCommentAsUser,
  resetActivityFeed,
  refetchChannel,
}: UseIssueModerationActionsParams) {
  const { mutate: deleteDiscussion } = useMutation(DELETE_DISCUSSION);
  const { mutate: deleteEvent } = useMutation(DELETE_EVENT);
  const { mutate: deleteComment } = useMutation(DELETE_COMMENT);

  const createFormValues = ref({ text: '', isRootComment: true, depth: 1 });
  const deleteReasonError = ref('');

  const updateComment = (text: string) => {
    createFormValues.value.text = text;
  };

  const handleCreateComment = async () => {
    if (!activeIssue.value) return;
    if (isSuspendedMod.value && !isOriginalUserAuthor.value) {
      return;
    }

    // Case 1: Current user is the original author who posted as a regular user
    if (isOriginalUserAuthor.value) {
      await addIssueActivityFeedItemWithCommentAsUser({
        issueId: activeIssue.value.id,
        commentText: createFormValues.value.text,
        username: username.value,
        actionDescription: 'commented on the issue',
        actionType: 'comment',
        channelUniqueName: channelId.value,
      });
    }
    // Case 2: Current user is the original author who posted as a mod
    else if (isOriginalModAuthor.value) {
      if (!modProfileName.value) return;
      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        commentText: createFormValues.value.text,
        displayName: modProfileName.value,
        actionDescription: 'commented on the issue',
        actionType: 'comment',
        channelUniqueName: channelId.value,
      });
    }
    // Case 3: Current user is not the original author - comment as mod
    else {
      if (!modProfileName.value) return;
      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        commentText: createFormValues.value.text,
        displayName: modProfileName.value,
        actionDescription: 'commented on the issue',
        actionType: 'comment',
        channelUniqueName: channelId.value,
      });
    }

    createFormValues.value.text = '';
    await resetActivityFeed();
  };

  const toggleCloseOpenIssue = async () => {
    if (!activeIssue.value || !modProfileName.value) return;
    if (isSuspendedMod.value) return;

    try {
      if (activeIssue.value.isOpen) {
        // Close the issue
        await closeIssue();

        if (createFormValues.value.text) {
          await addIssueActivityFeedItemWithCommentAsMod({
            issueId: activeIssue.value.id,
            displayName: modProfileName.value,
            actionDescription: 'closed the issue',
            actionType: 'close',
            commentText: createFormValues.value.text,
            channelUniqueName: channelId.value,
          });
        } else {
          await addIssueActivityFeedItem({
            issueId: activeIssue.value.id,
            displayName: modProfileName.value,
            actionDescription: 'closed the issue',
            actionType: 'close',
          });
        }
      } else {
        // Reopen the issue
        await reopenIssue();

        if (createFormValues.value.text) {
          await addIssueActivityFeedItemWithCommentAsMod({
            issueId: activeIssue.value.id,
            displayName: modProfileName.value,
            actionDescription: 'reopened the issue',
            actionType: 'reopen',
            commentText: createFormValues.value.text,
            channelUniqueName: channelId.value,
          });
        } else {
          await addIssueActivityFeedItem({
            issueId: activeIssue.value.id,
            displayName: modProfileName.value,
            actionDescription: 'reopened the issue',
            actionType: 'reopen',
          });
        }
      }

      // Refetch channel data to update issue counts in the UI
      try {
        await refetchChannel();
      } catch (error) {
        console.error('Error refetching channel data:', error);
      }

      // Reset comment form
      createFormValues.value.text = '';
      await resetActivityFeed();
    } catch (error) {
      console.error('Error toggling issue open/close state:', error);
    }
  };

  const resolveDeleteReason = () => {
    const trimmedReason = createFormValues.value.text.trim();
    return trimmedReason || 'No reason provided.';
  };

  const requireDeleteReasonIfNotOp = () => {
    deleteReasonError.value = '';
    if (isCurrentUserOriginalPoster.value) {
      return true;
    }
    if (!createFormValues.value.text.trim()) {
      deleteReasonError.value = 'Please provide a reason before deleting.';
      return false;
    }
    return true;
  };

  // Discussion/event/comment deletion share the same close-issue -> log-action
  // -> delete -> refresh flow; only the mutation and the feed label differ.
  const RELATED_CONTENT_DELETE = {
    discussion: {
      mutate: (id: string) => deleteDiscussion({ id }),
      label: 'deleted the discussion',
    },
    event: {
      mutate: (id: string) => deleteEvent({ id }),
      label: 'deleted the event',
    },
    comment: {
      mutate: (id: string) => deleteComment({ id }),
      label: 'deleted the comment',
    },
  } as const;

  type RelatedContentKind = keyof typeof RELATED_CONTENT_DELETE;

  const handleDeleteRelatedContent = async (
    kind: RelatedContentKind,
    id: string
  ) => {
    if (!id) return;
    if (!requireDeleteReasonIfNotOp()) return;

    const { mutate, label } = RELATED_CONTENT_DELETE[kind];

    try {
      if (modProfileName.value && activeIssue.value) {
        if (activeIssue.value.isOpen) {
          await closeIssue();
        }

        await addIssueActivityFeedItemWithCommentAsMod({
          issueId: activeIssue.value.id,
          displayName: modProfileName.value,
          actionDescription: label,
          actionType: 'delete',
          commentText: resolveDeleteReason(),
          channelUniqueName: channelId.value,
        });
      }

      await mutate(id);
      createFormValues.value.text = '';
      deleteReasonError.value = '';
      await resetActivityFeed();
    } catch (error) {
      console.error(`Error deleting ${kind}:`, error);
    }
  };

  return {
    createFormValues,
    deleteReasonError,
    updateComment,
    handleCreateComment,
    toggleCloseOpenIssue,
    handleDeleteRelatedContent,
  };
}
