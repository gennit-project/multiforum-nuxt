import type {
  GetUserContributionsQuery,
  GetChannelContributionsQuery,
} from '@/__generated__/operations';

export type UserContributionDay =
  GetUserContributionsQuery['getUserContributions'][number];
export type UserContributionActivity =
  UserContributionDay['activities'][number];
// Moderation days share only the chart's activity identity/description contract.
// Detail collections are the exact selected user-contribution summaries.
export type Activity = Pick<
  UserContributionActivity,
  'id' | 'type' | 'description'
> &
  Partial<
    Pick<
      UserContributionActivity,
      'Comments' | 'Discussions' | 'Events' | 'WikiEdits'
    >
  >;
export type DayData = Pick<UserContributionDay, 'date' | 'count'> & {
  activities: Activity[];
};

export type ChannelContributor =
  GetChannelContributionsQuery['getChannelContributions'][number];
export type ChannelContributionDay = ChannelContributor['dayData'][number];
