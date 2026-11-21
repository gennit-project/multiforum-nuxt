import {
  getDiscussionSegment,
  type DiscussionLinkTarget,
} from '@/utils/contentUrls';

// Links to discussion/download sub-pages (edit, feedback, download tabs).
// contentUrls.ts owns the detail-page links; these cover the nested routes
// that carry the same `{number}-{slug}` segment.

type LinkableDiscussion = {
  id?: string | null;
  title?: string | null;
  DiscussionChannels?: ReadonlyArray<{
    channelUniqueName?: string | null;
    discussionNumber?: number | null;
  }> | null;
} | null;

type DiscussionLinkTargetParams = {
  discussion: LinkableDiscussion | undefined;
  /** The forum the link is for; selects that forum's discussion number. */
  channelId: string;
};

/**
 * The link target (forum + per-forum number + title slug) for a loaded
 * discussion, for use with `getDiscussionUrl` / `getDownloadUrl` and the
 * named-route helpers in contentUrls.ts. Numbers are per forum, so the number
 * comes from the DiscussionChannel for `channelId`.
 */
export const getDiscussionLinkTarget = ({
  discussion,
  channelId,
}: DiscussionLinkTargetParams): DiscussionLinkTarget => {
  const discussionChannel = discussion?.DiscussionChannels?.find(
    (item) => item.channelUniqueName === channelId
  );
  return {
    forumId: channelId,
    discussionNumber: discussionChannel?.discussionNumber,
    title: discussion?.title,
    discussionId: discussion?.id,
  };
};

/** The `{number}-{slug}` route segment for a loaded discussion in a forum. */
export const getLoadedDiscussionSegment = (
  params: DiscussionLinkTargetParams
) => getDiscussionSegment(getDiscussionLinkTarget(params));

export const getDiscussionEditUrl = (target: DiscussionLinkTarget) =>
  `/forums/${target.forumId}/discussions/edit/${getDiscussionSegment(target)}`;

export const getDownloadEditUrl = (target: DiscussionLinkTarget) =>
  `/forums/${target.forumId}/downloads/edit/${getDiscussionSegment(target)}`;

export const getDiscussionFeedbackRoute = (target: DiscussionLinkTarget) => ({
  name: 'forums-forumId-discussions-feedback-discussionId' as const,
  params: {
    forumId: target.forumId,
    discussionId: getDiscussionSegment(target),
  },
});

export type DownloadTab = 'description' | 'comments' | 'activity' | 'pipelines';

type DownloadTabParams = {
  target: DiscussionLinkTarget;
  tab: DownloadTab;
};

export const getDownloadTabUrl = ({ target, tab }: DownloadTabParams) =>
  `/forums/${target.forumId}/downloads/${getDiscussionSegment(target)}/${tab}`;

export const getDownloadTabRoute = ({ target, tab }: DownloadTabParams) => ({
  name: `forums-forumId-downloads-discussionId-${tab}` as const,
  params: {
    forumId: target.forumId,
    discussionId: getDiscussionSegment(target),
  },
});
