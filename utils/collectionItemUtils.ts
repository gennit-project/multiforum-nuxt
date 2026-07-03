import { safeArrayFirst } from '@/utils/ssrSafetyUtils';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';
import type {
  Discussion,
  Comment,
  DiscussionChannel,
} from '@/__generated__/graphql';

/**
 * Pure helpers for the collection detail page
 * (pages/library/[collectionId].vue). Extracted so the type-label, item
 * selection, link building, and author resolution logic is unit-testable.
 */

export type CollectionType =
  | 'DISCUSSIONS'
  | 'COMMENTS'
  | 'IMAGES'
  | 'CHANNELS'
  | 'DOWNLOADS'
  | string
  | null
  | undefined;

/** Human-readable label for a collection type. */
export function getCollectionTypeLabel(type: CollectionType): string {
  switch (type) {
    case 'DISCUSSIONS':
      return 'Discussions';
    case 'COMMENTS':
      return 'Comments';
    case 'IMAGES':
      return 'Images';
    case 'CHANNELS':
      return 'Forums';
    case 'DOWNLOADS':
      return 'Downloads';
    default:
      return 'Items';
  }
}

export interface CollectionLike {
  collectionType?: CollectionType;
  Discussions?: unknown[];
  Comments?: unknown[];
  Images?: unknown[];
  Channels?: unknown[];
  Downloads?: unknown[];
  itemOrder?: string[] | null;
}

/**
 * Select the items array that matches the collection's type. The element type
 * is heterogeneous across collection types, so the return is intentionally
 * loose (matching the page's original inline behavior).
 */
export function getCollectionItems(
  collection: CollectionLike | null | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  if (!collection) return [];
  let items: unknown[];
  switch (collection.collectionType) {
    case 'DISCUSSIONS':
      items = collection.Discussions || [];
      break;
    case 'COMMENTS':
      items = collection.Comments || [];
      break;
    case 'IMAGES':
      items = collection.Images || [];
      break;
    case 'CHANNELS':
      items = collection.Channels || [];
      break;
    case 'DOWNLOADS':
      items = collection.Downloads || [];
      break;
    default:
      return [];
  }

  return orderCollectionItems(items, collection.itemOrder);
}

export function getCollectionItemStableId(item: unknown): string {
  if (!item || typeof item !== 'object') return '';
  const record = item as { id?: string | null; uniqueName?: string | null };
  return record.id || record.uniqueName || '';
}

export function orderCollectionItems<T>(
  items: T[],
  itemOrder: string[] | null | undefined
): T[] {
  if (!itemOrder?.length) return items;

  const itemById = new Map(
    items
      .map((item) => [getCollectionItemStableId(item), item] as const)
      .filter(([id]) => Boolean(id))
  );
  const orderedItems = itemOrder
    .map((id) => itemById.get(id))
    .filter((item): item is T => Boolean(item));
  const orderedIds = new Set(itemOrder);
  const unorderedItems = items.filter(
    (item) => !orderedIds.has(getCollectionItemStableId(item))
  );

  return [...orderedItems, ...unorderedItems];
}

/**
 * Build the route for a discussion within a collection. Downloads (either the
 * discussion's own flag or a downloads-typed collection) link to the downloads
 * path. Returns '/' when no channel is available.
 */
export function buildCollectionDiscussionLink(params: {
  discussion: Discussion;
  isDownloadsCollection: boolean;
}): string {
  const { discussion, isDownloadsCollection } = params;
  const firstChannel = safeArrayFirst(
    discussion.DiscussionChannels
  ) as DiscussionChannel | null;
  if (!firstChannel?.channelUniqueName) return '/';

  const isDownload = discussion?.hasDownload === true || isDownloadsCollection;
  const basePath = isDownload ? 'downloads' : 'discussions';
  return `/forums/${firstChannel.channelUniqueName}/${basePath}/${discussion.id}`;
}

export interface CollectionAuthorInfo {
  username: string;
  displayName: string;
  profilePicURL: string;
  commentKarma: number;
  discussionKarma: number;
  createdAt: string;
  isAdmin: boolean;
}

/**
 * Resolve the author info for a collection item. Comments expose
 * `CommentAuthor`, other items expose `Author`. Moderation profiles (no
 * username) collapse to display-name-only info. Returns null when there is no
 * author.
 */
export function resolveCollectionItemAuthor(params: {
  item: Discussion | Comment;
  adminUsernames: string[];
}): CollectionAuthorInfo | null {
  const { item, adminUsernames } = params;
  const author =
    'CommentAuthor' in item
      ? item.CommentAuthor
      : 'Author' in item
        ? item.Author
        : null;
  if (!author) return null;

  const isUser = 'username' in author && author.username;
  const username = isUser ? author.username : '';

  const serverRoleBadge = getServerRoleBadge({
    username: username || undefined,
    adminUsernames,
  });

  return {
    username: username || '',
    displayName: author.displayName || '',
    profilePicURL:
      isUser && 'profilePicURL' in author ? author.profilePicURL || '' : '',
    commentKarma:
      isUser && 'commentKarma' in author ? (author.commentKarma ?? 0) : 0,
    discussionKarma:
      isUser && 'discussionKarma' in author ? (author.discussionKarma ?? 0) : 0,
    createdAt: isUser && 'createdAt' in author ? author.createdAt || '' : '',
    isAdmin: serverRoleBadge === 'serverAdmin',
  };
}
