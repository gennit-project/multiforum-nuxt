import type { DownloadListPresentation } from '@/types/DiscussionList';
import type { GetUserDownloadsQuery } from '@/__generated__/operations';
import { useQuery } from '@vue/apollo-composable';
import {
  GetDiscussionsInChannelDocument,
  GetSiteWideDiscussionListDocument,
} from '@/__generated__/operations';

export function checkDiscussionListContracts() {
  const channel = useQuery(GetDiscussionsInChannelDocument, {
    channelUniqueName: 'cats',
    searchInput: '',
    showArchived: false,
  });
  const sitewide = useQuery(GetSiteWideDiscussionListDocument, {
    searchInput: '',
    showArchived: false,
  });
  // @ts-expect-error route arrays must be narrowed before querying a forum
  channel.refetch({ channelUniqueName: ['cats'] });
  // @ts-expect-error pagination limits are numeric
  sitewide.refetch({ options: { limit: '20' } });
  const row =
    channel.result.value?.getDiscussionsInChannel?.discussionChannels[0];
  // @ts-expect-error this channel operation selects CommentsAggregate instead
  void row?.CommentsConnection;
  // @ts-expect-error nullable discussions must be checked before rendering
  const title: string = row?.Discussion.title;
  // @ts-expect-error sitewide list does not select a score
  void sitewide.result.value?.getSiteWideDiscussionList?.discussions[0]?.score;
  return { title, count: row?.CommentsAggregate?.count };
}

export function checkProfileDownloadPresentation(
  profile: GetUserDownloadsQuery['users'][number]['Discussions'][number]
): DownloadListPresentation {
  // @ts-expect-error profile download query does not select media moderation state
  void profile.DownloadableFiles;
  return profile;
}
