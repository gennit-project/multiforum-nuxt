import type {
  GetDiscussionsInChannelQuery,
  GetUserDownloadsQuery,
  GetSiteWideDiscussionListQuery,
} from '@/__generated__/operations';
import type { NullableSelection } from './Comment';

export type ChannelListItem = NonNullable<
  GetDiscussionsInChannelQuery['getDiscussionsInChannel']
>['discussionChannels'][number];
export type SitewideListItem = NonNullable<
  GetSiteWideDiscussionListQuery['getSiteWideDiscussionList']
>['discussions'][number];
export type ChannelListPresentation = NullableSelection<ChannelListItem>;
export type ChannelDiscussionPresentation = NullableSelection<
  NonNullable<ChannelListItem['Discussion']>
>;
export type SitewideDiscussionPresentation =
  NullableSelection<SitewideListItem>;

/** Profile downloads omit vote/media moderation fields; preserve that absence. */
export type DownloadListPresentation =
  | SitewideDiscussionPresentation
  | NullableSelection<
      GetUserDownloadsQuery['users'][number]['Discussions'][number]
    >;
