import type { GetChannelQuery, GetSortedChannelsDiscussionsQuery } from '@/__generated__/operations';

export type ChannelDetail = GetChannelQuery['channels'][number];
type ListedChannel = NonNullable<NonNullable<GetSortedChannelsDiscussionsQuery['getSortedChannels']>['channels']>[number];
// Profile forum lists omit displayName; presentation falls back to uniqueName.
export type ChannelListEntry = Omit<NonNullable<ListedChannel>, 'displayName' | 'isFavorited'> & Partial<Pick<NonNullable<ListedChannel>, 'displayName' | 'isFavorited'>>;
export type ChannelFilterGroup = ChannelDetail['FilterGroups'][number];
export type ChannelFilterOption = ChannelFilterGroup['options'][number];
