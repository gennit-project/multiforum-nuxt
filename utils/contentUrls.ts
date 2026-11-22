/**
 * Central builders for content links in the short URL scheme:
 *
 *   /forums/{forum}/discussions/{discussionNumber}-{slug}
 *   /forums/{forum}/downloads/{discussionNumber}-{slug}
 *   /forums/{forum}/events/{eventNumber}-{slug}
 *   /forums/{forum}/(discussions|events)/{number}-{slug}/comments/{shortId}
 *   /u/{username}/images/{imageNumber}
 *   /u/{username}/albums/{albumNumber}
 *   /u/{username}/collections/{collectionNumber}-{slug}
 *
 * The leading number (or comment shortId) is the canonical identifier; the
 * slug is decorative and ignored on lookup. Every link to this content should
 * come through these helpers so a title edit or URL-scheme change has one home.
 *
 * Each content type has three builders: `get*Segment` (the route param value),
 * `get*Route` (a named-route location carrying that segment) and `get*Url`
 * (the plain path). When the number has not been selected/loaded the segment
 * falls back to the raw `id`, which keeps links rendering but is not routable
 * by the detail pages, so GraphQL selections that feed links must request the
 * number fields.
 */
import { buildSlugSegment } from '@/utils/slugify';

type MaybeNumber = number | null | undefined;
type MaybeText = string | null | undefined;

type NumberedSegmentParams = {
  number: MaybeNumber;
  title?: MaybeText;
  fallbackId?: MaybeText;
};

const getNumberedSegment = ({
  number,
  title,
  fallbackId,
}: NumberedSegmentParams): string =>
  number == null
    ? (fallbackId ?? '')
    : buildSlugSegment({ id: number, title });

// ---------------------------------------------------------------------------
// Discussions and downloads (downloads are discussions with hasDownload)
// ---------------------------------------------------------------------------

export type DiscussionLinkTarget = {
  forumId: string;
  discussionNumber: MaybeNumber;
  title?: MaybeText;
  /** Raw global id, used only when no number is available. */
  discussionId?: MaybeText;
};

type DiscussionSegmentParams = Pick<
  DiscussionLinkTarget,
  'discussionNumber' | 'title' | 'discussionId'
>;

export const getDiscussionSegment = (target: DiscussionSegmentParams) =>
  getNumberedSegment({
    number: target.discussionNumber,
    title: target.title,
    fallbackId: target.discussionId,
  });

export const getDiscussionUrl = (target: DiscussionLinkTarget) =>
  `/forums/${target.forumId}/discussions/${getDiscussionSegment(target)}`;

export const getDiscussionRoute = (target: DiscussionLinkTarget) => ({
  name: 'forums-forumId-discussions-discussionId' as const,
  params: {
    forumId: target.forumId,
    discussionId: getDiscussionSegment(target),
  },
});

export const getDownloadUrl = (target: DiscussionLinkTarget) =>
  `/forums/${target.forumId}/downloads/${getDiscussionSegment(target)}`;

export const getDownloadRoute = (target: DiscussionLinkTarget) => ({
  name: 'forums-forumId-downloads-discussionId' as const,
  params: {
    forumId: target.forumId,
    discussionId: getDiscussionSegment(target),
  },
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type EventLinkTarget = {
  forumId: string;
  eventNumber: MaybeNumber;
  title?: MaybeText;
  /** Raw global id, used only when no number is available. */
  eventId?: MaybeText;
};

type EventSegmentParams = Pick<
  EventLinkTarget,
  'eventNumber' | 'title' | 'eventId'
>;

export const getEventSegment = (target: EventSegmentParams) =>
  getNumberedSegment({
    number: target.eventNumber,
    title: target.title,
    fallbackId: target.eventId,
  });

export const getEventUrl = (target: EventLinkTarget) =>
  `/forums/${target.forumId}/events/${getEventSegment(target)}`;

export const getEventRoute = (target: EventLinkTarget) => ({
  name: 'forums-forumId-events-eventId' as const,
  params: {
    forumId: target.forumId,
    eventId: getEventSegment(target),
  },
});

// ---------------------------------------------------------------------------
// Comments (permalinks use the comment's shortId)
// ---------------------------------------------------------------------------

type CommentPermalinkBase = {
  /** The comment's public shortId handle. */
  shortId: MaybeText;
  /** Raw global comment id, used only when no shortId is available. */
  commentId?: MaybeText;
};

export type DiscussionCommentLinkTarget = CommentPermalinkBase &
  DiscussionLinkTarget;

export type EventCommentLinkTarget = CommentPermalinkBase & EventLinkTarget;

export const getCommentSegment = (target: CommentPermalinkBase) =>
  target.shortId || target.commentId || '';

export const getDiscussionCommentUrl = (
  target: DiscussionCommentLinkTarget
) => `${getDiscussionUrl(target)}/comments/${getCommentSegment(target)}`;

export const getDiscussionCommentRoute = (
  target: DiscussionCommentLinkTarget
) => ({
  name: 'forums-forumId-discussions-discussionId-comments-commentId' as const,
  params: {
    forumId: target.forumId,
    discussionId: getDiscussionSegment(target),
    commentId: getCommentSegment(target),
  },
});

export const getDownloadCommentRoute = (
  target: DiscussionCommentLinkTarget
) => ({
  name: 'forums-forumId-downloads-discussionId-comments-commentId' as const,
  params: {
    forumId: target.forumId,
    discussionId: getDiscussionSegment(target),
    commentId: getCommentSegment(target),
  },
});

export const getEventCommentUrl = (target: EventCommentLinkTarget) =>
  `${getEventUrl(target)}/comments/${getCommentSegment(target)}`;

export const getEventCommentRoute = (target: EventCommentLinkTarget) => ({
  name: 'forums-forumId-events-eventId-comments-commentId' as const,
  params: {
    forumId: target.forumId,
    eventId: getEventSegment(target),
    commentId: getCommentSegment(target),
  },
});

// ---------------------------------------------------------------------------
// Images, albums and collections (scoped to the owning user)
// ---------------------------------------------------------------------------

export type ImageLinkTarget = {
  username: string;
  imageNumber: MaybeNumber;
  /** Raw global id, used only when no number is available. */
  imageId?: MaybeText;
};

export const getImageSegment = (target: ImageLinkTarget) =>
  getNumberedSegment({
    number: target.imageNumber,
    fallbackId: target.imageId,
  });

export const getImageUrl = (target: ImageLinkTarget) =>
  `/u/${target.username}/images/${getImageSegment(target)}`;

export type AlbumLinkTarget = {
  username: string;
  albumNumber: MaybeNumber;
  /** Raw global id, used only when no number is available. */
  albumId?: MaybeText;
};

export const getAlbumSegment = (target: AlbumLinkTarget) =>
  getNumberedSegment({
    number: target.albumNumber,
    fallbackId: target.albumId,
  });

export const getAlbumUrl = (target: AlbumLinkTarget) =>
  `/u/${target.username}/albums/${getAlbumSegment(target)}`;

export type CollectionLinkTarget = {
  username: string;
  collectionNumber: MaybeNumber;
  /** The collection's name, used for the decorative slug. */
  name?: MaybeText;
  /** Raw global id, used only when no number is available. */
  collectionId?: MaybeText;
};

export const getCollectionSegment = (target: CollectionLinkTarget) =>
  getNumberedSegment({
    number: target.collectionNumber,
    title: target.name,
    fallbackId: target.collectionId,
  });

export const getCollectionUrl = (target: CollectionLinkTarget) =>
  `/u/${target.username}/collections/${getCollectionSegment(target)}`;
