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
      locked
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
      DiscussionChannelsAggregate(
        where: { Discussion: { NOT: { title: null } } }
      ) {
        count
      }
      IssuesAggregate(
        where: {
         isOpen: true 
        }
      ) {
        count
      }
      EventChannelsAggregate(
        where: {
          NOT: { Event: null }
          Event: { canceled: false, endTime_GT: $now }
        }
      ) {
        count
      }
    }
  }
`;

export const GET_CHANNEL_RULES = gql`
  query getChannelRules($uniqueName: String!) {
    channels(where: { uniqueName: $uniqueName }) {
      uniqueName
      rules
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
              { canceled: false, endTime_GT: $now }
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
  query getSortedChannels(
    $offset: Int
    $limit: Int
    $tags: [String]
    $searchInput: String
  ) {
    getSortedChannels(
      offset: $offset
      limit: $limit
      tags: $tags
      searchInput: $searchInput
    ) {
      channels {
        uniqueName
        displayName
        channelIconURL
        description
        Tags {
          text
        }
        EventChannelsAggregate {
          count
        }
        DiscussionChannelsAggregate {
          count
        }
      }
      aggregateChannelCount
    }
  }
`;
