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

export const GET_CHANNEL_WIKI = gql`
  query getChannelWiki($uniqueName: String!) {
    channels(where: { uniqueName: $uniqueName }) {
      uniqueName
      wikiEnabled
      WikiHomePage {
        id
        title
        body
        slug
        createdAt
        updatedAt
        VersionAuthor {
          username
        }
        PastVersions(options: { sort: [{ createdAt: DESC }] }) {
          id
          body
          createdAt
          Author {
            username
          }
        }
        ChildPages {
          id
          title
          slug
          createdAt
          updatedAt
          VersionAuthor {
            username
          }
        }
      }
    }
  }
`;

export const GET_WIKI_PAGE = gql`
  query getWikiPage($channelUniqueName: String!, $slug: String!) {
    wikiPages(where: { channelUniqueName: $channelUniqueName, slug: $slug }) {
      id
      title
      body
      slug
      createdAt
      updatedAt
      VersionAuthor {
        username
      }
      ChildPages {
        id
        title
        slug
        createdAt
        updatedAt
        VersionAuthor {
          username
        }
      }
      PastVersions(options: { sort: [{ createdAt: DESC }] }) {
        id
        body
        createdAt
        Author {
          username
        }
      }
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
      wikiEnabled
      eventsEnabled
      feedbackEnabled
      WikiHomePage {
        id
        title
        body
        slug
        createdAt
        updatedAt
        VersionAuthor {
          username
        }
        PastVersions(options: { sort: [{ createdAt: DESC }] }) {
          id
          body
          createdAt
          Author {
            username
          }
        }
        ChildPages {
          id
          title
          slug
          createdAt
          updatedAt
          VersionAuthor {
            username
          }
        }
      }
      Tags {
        text
      }
      Admins {
        username
        displayName
        profilePicURL
        commentKarma
        discussionKarma
        createdAt
      }
      Moderators {
        displayName
      }
      DiscussionChannelsAggregate(
        where: {
          AND: [
            { NOT: { archived: true } }
            { NOT: { Discussion: null } }
            { NOT: { Discussion: { hasDownload: true } } }
          ]
        }
      ) {
        count
      }
      IssuesAggregate(where: { isOpen: true }) {
        count
      }
      EventChannelsAggregate(
        where: {
          NOT: { archived: true, Event: null }
          Event: { canceled: false, endTime_GT: $now }
        }
      ) {
        count
      }
      DefaultModRole {
        canHideComment
        canHideEvent
        canHideDiscussion
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      ElevatedModRole {
        canHideComment
        canHideEvent
        canHideDiscussion
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      SuspendedModRole {
        canHideComment
        canHideEvent
        canHideDiscussion
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultChannelRole {
        canCreateComment
        canCreateDiscussion
        canCreateEvent
        canUpdateChannel
        canUploadFile
        canUpvoteComment
        canUpvoteDiscussion
        channelUniqueName
      }
      SuspendedRole {
        canCreateComment
        canCreateDiscussion
        canCreateEvent
        canUpdateChannel
        canUploadFile
        canUpvoteComment
        canUpvoteDiscussion
        channelUniqueName
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
          { EventChannels_SOME: { channelUniqueName: $uniqueName, archived: false } }
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
  query getSortedChannels($offset: Int, $limit: Int, $tags: [String], $searchInput: String) {
    getSortedChannels(offset: $offset, limit: $limit, tags: $tags, searchInput: $searchInput) {
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
        DiscussionChannelsAggregate(
          where: {
            AND: [
              { NOT: { archived: true } }
              { NOT: { Discussion: null } }
              { NOT: { Discussion: { hasDownload: true } } }
            ]
          }
        ) {
          count
        }
      }
      aggregateChannelCount
    }
  }
`;
