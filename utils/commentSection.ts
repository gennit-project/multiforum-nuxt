/**
 * Pure helpers extracted from CommentSection: filtering comments by a search
 * term and resolving the effective channel unique name from an explicit value
 * with a fallback to the first comment's channel.
 */

export type ChannelResolvableComment = {
  id?: string | null;
  DiscussionChannel?: { channelUniqueName?: string | null } | null;
  Channel?: { uniqueName?: string | null } | null;
};

export type FilterCommentsParams<T> = {
  comments: T[] | null | undefined;
  searchText: string;
};

export function filterCommentsBySearch<T extends { text?: string | null }>(
  params: FilterCommentsParams<T>
): T[] {
  const { comments, searchText } = params;
  const list = comments || [];
  const term = searchText.trim().toLowerCase();
  if (!term) return list;
  return list.filter((comment) =>
    comment?.text?.toLowerCase().includes(term)
  );
}

export type ResolveChannelParams = {
  comments: ChannelResolvableComment[] | null | undefined;
  explicitChannelUniqueName?: string | null;
};

export function resolveChannelUniqueName(
  params: ResolveChannelParams
): string {
  const { comments, explicitChannelUniqueName } = params;
  if (explicitChannelUniqueName) return explicitChannelUniqueName;
  const firstComment = (comments || []).find((comment) => !!comment?.id);
  return (
    firstComment?.DiscussionChannel?.channelUniqueName ||
    firstComment?.Channel?.uniqueName ||
    ''
  );
}

/**
 * A comment with at least one reply is soft-deleted (its text is blanked but
 * the node is kept so the thread structure survives); a leaf comment is hard
 * deleted.
 */
export function shouldSoftDeleteComment(replyCount: number): boolean {
  return replyCount > 0;
}

export type CommentInProgressLengthParams = {
  /** Whether an edit form is currently open. */
  editFormOpen: boolean;
  /** The text in the edit form. */
  editText: string;
  /** Whether a reply form is currently open. */
  replyFormOpen: boolean;
  /** The text in the create/reply form, if any. */
  createText?: string | null;
};

/**
 * Length of the comment currently being authored. An open edit form takes
 * precedence over an open reply form; when neither is open the length is 0.
 */
export function getCommentInProgressLength(
  params: CommentInProgressLengthParams
): number {
  const { editFormOpen, editText, replyFormOpen, createText } = params;
  if (editFormOpen) return editText.length;
  if (replyFormOpen && createText) return createText.length;
  return 0;
}

export type ReplyInput = {
  parentCommentId: string;
  text: string;
  depth: number;
};

/**
 * Build the payload emitted when a user replies to a comment. Replies are never
 * root comments. Throws when the parent comment id is missing, since a reply
 * with no parent cannot be attached to a thread.
 */
export function buildReplyCommentInput(input: ReplyInput): {
  text: string;
  isRootComment: false;
  parentCommentId: string;
  depth: number;
} {
  const { text, parentCommentId, depth } = input;
  if (!parentCommentId) {
    throw new Error('parentCommentId is required to reply to a comment');
  }
  return { text, isRootComment: false, parentCommentId, depth };
}
