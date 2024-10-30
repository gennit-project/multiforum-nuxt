import { gql } from "@apollo/client/core";

export const GET_CHANNEL_NAMES = gql`
  query getChannelNames($channelWhere: ChannelWhere) {
    channels(where: $channelWhere, options: { limit: 10 }) {
      uniqueName
      displayName
      channelIconURL
      description
    }
  }
`;

export const GET_CHANNEL = gql`
  query getChannel($uniqueName: String!, $now: DateTime) {
    channels(where: { uniqueName: $uniqueName }) {
      uniqueName
      displayName
      description
      channelIconURL
      channelBannerURL
      rules
      Tags {
        text
      }
      Admins {
        username
        profilePicURL
        commentKarma
        discussionKarma
        createdAt
      }
      Moderators {
        displayName
      }
      DiscussionChannelsAggregate (
        where: {
          Discussion: {
            NOT: {
              title: null
            }
          }
        }
      ) {
        count
      }
      IssuesAggregate {
        count
      }
      EventChannelsAggregate(
        where: {
          NOT: { Event: null }
          Event: { canceled: false, startTime_GT: $now }
        }
      ) {
        count
      }
    }
  }
`;

export const GET_SOONEST_EVENTS_IN_CHANNEL = gql`
  query getEvents($uniqueName: String!, $now: DateTime) {
    events(
      options: { limit: 4, sort: [{ startTime: ASC }] }
      where: {
        AND: [
          { EventChannels_SOME: { channelUniqueName: $uniqueName } }
          {
            OR: [
              { canceled: false, startTime_GT: $now }
              { canceled: false, startTime_LT: $now, endTime_GT: $now }
            ]
          }
        ]
      }
    ) {
      id
      title
      startTime
      endTime
      virtualEventUrl
    }
  }
`;

export const GET_CHANNELS = gql`
  query getChannels(
    $channelWhere: ChannelWhere
    $eventChannelWhere: EventChannelWhere
    $limit: Int
    $offset: Int
    $sort: [ChannelSort!]
  ) {
    channelsAggregate(where: $channelWhere) {
      count
    }
    channels(
      where: $channelWhere
      options: { limit: $limit, offset: $offset, sort: $sort }
    ) {
      uniqueName
      displayName
      channelIconURL
      description
      Tags {
        text
      }
      EventChannelsAggregate(where: $eventChannelWhere) {
        count
      }
      DiscussionChannelsAggregate {
        count
      }
    }
  }
`;
