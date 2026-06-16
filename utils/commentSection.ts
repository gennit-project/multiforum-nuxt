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
