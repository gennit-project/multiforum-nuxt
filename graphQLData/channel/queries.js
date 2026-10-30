import { gql } from '@apollo/client/core';
import { DateTime } from 'luxon';
import { AUTHOR_FIELDS, CHANNEL_ICON_FIELDS } from '../fragments';

export const GET_CHANNEL_NAMES = gql`
  query getChannelNames($channelWhere: ChannelWhere) {
    channels(where: $channelWhere, limit: 10) {
      uniqueName
      displayName
      ...ChannelIconFields
      description
      eventsEnabled
    }
  }
  ${CHANNEL_ICON_FIELDS}
`;

export const GET_CHANNEL_DISCUSSION_FLAIR_CONFIG = gql`
  query getChannelDiscussionFlairConfig(
    $channelUniqueName: String!
    $includeArchived: Boolean = false
  ) {
    getChannelDiscussionFlairConfig(
      channelUniqueName: $channelUniqueName
      includeArchived: $includeArchived
    ) {
      channelUniqueName
      flairRequired
      flairs {
        id
        channelUniqueName
        displayName
        color
        order
        archived
      }
    }
  }
`;

export const GET_WIKI_PAGE = gql`
  query getWikiPage($channelUniqueName: String!, $slug: String!) {
    wikiPages(
      where: { channelUniqueName: { eq: $channelUniqueName }, slug: { eq: $slug } }
    ) {
      id
      title
      body
      editReason
      slug
      createdAt
      updatedAt
      locked
      lockedAt
      lockReason
      lockedByUsername
      VersionAuthor {
        username
      }
      ChildPages {
        id
        title
        editReason
        slug
        createdAt
        updatedAt
        locked
        lockedAt
        lockReason
        lockedByUsername
        VersionAuthor {
          username
        }
      }
      PastVersions(sort: [{ createdAt: DESC }]) {
        id
        body
        editReason
        createdAt
        Author {
          username
        }
      }
    }
  }
`;

export const GET_CHANNEL = gql`
  query getChannel($uniqueName: String!, $now: DateTime, $loggedInUsername: String) {
    channels(where: { uniqueName: { eq: $uniqueName } }) {
      uniqueName
      displayName
      description
      ...ChannelIconFields
      channelBannerURL
      isFavorited(username: $loggedInUsername)
      rules
      locked
      lockedAt
      lockReason
      LockedBy {
        displayName
      }
      wikiEnabled
      eventsEnabled
      feedbackEnabled
      imageUploadsEnabled
      markdownImagesEnabled
      emojiEnabled
      downloadsEnabled
      allowedFileTypes
      # Only the fields forum pages read. The full revision history
      # (PastVersions with every past body) made this response ~36 KB larger on
      # every forum page; the wiki page and revision views fetch it themselves.
      WikiHomePage {
        id
        title
        body
        editReason
        slug
        createdAt
        updatedAt
        VersionAuthor {
          username
        }
      }
      PinnedWikiPages(sort: [{ updatedAt: DESC }]) {
        id
        title
        slug
        updatedAt
      }
      Tags {
        text
      }
      Admins {
        ...AuthorFields
      }
      Bots {
        username
        displayName
        botProfileId
        isDeprecated
        SuspensionsConnection(
          where: {
            node: {
              OR: [
                { suspendedIndefinitely: { eq: true } }
                { suspendedUntil_GT: $now }
              ]
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
      }
      Moderators {
        displayName
      }
      SuspendedMods {
        modProfileName
      }
      SuspendedUsers {
        username
      }
      DiscussionChannelsConnection(
        where: {
          node: {
            AND: [
              { NOT: { Discussion: null } }
              { NOT: { Discussion: { hasDownload: { eq: true } } } }
            ]
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      IssuesConnection(where: { node: { isOpen: { eq: true } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
      EventChannelsConnection(
        where: {
          node: {
            NOT: { archived: { eq: true }, Event: null }
            Event: { canceled: { eq: false }, endTime_GT: $now }
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      DefaultModRole {
        canHideComment
        canHideEvent
        canHideDiscussion
        canDeleteWiki
        canEditComments
        canEditDiscussions
        canEditEvents
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
        canDeleteWiki
        canEditComments
        canEditDiscussions
        canEditEvents
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
        canDeleteWiki
        canEditComments
        canEditDiscussions
        canEditEvents
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
      ElevatedChannelRole {
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
      FilterGroups(sort: [{ order: ASC }]) {
        id
        key
        displayName
        mode
        uploadSelection
        order
        options(sort: [{ order: ASC }]) {
          id
          value
          displayName
          order
        }
      }
    }
  }
  ${AUTHOR_FIELDS}
  ${CHANNEL_ICON_FIELDS}
`;

export const GET_CHANNEL_RULES = gql`
  query getChannelRules($uniqueName: String!) {
    channels(where: { uniqueName: { eq: $uniqueName } }) {
      uniqueName
      rules
    }
  }
`;

export const GET_SOONEST_EVENTS_IN_CHANNEL = gql`
  query getEvents($uniqueName: String!, $now: DateTime) {
    events(
      limit: 4
      sort: [{ startTime: ASC }]
      where: {
        AND: [
          {
            EventChannels_SOME: {
              channelUniqueName: { eq: $uniqueName }
              archived: { eq: false }
            }
          }
          {
            OR: [
              { canceled: { eq: false }, endTime_GT: $now }
              { canceled: { eq: false }, startTime_LT: $now, endTime_GT: $now }
            ]
          }
        ]
      }
    ) {
      id
      title
      startTime
      endTime
      isAllDay
      virtualEventUrl
    }
  }
`;

// Round down to nearest 10 seconds to ensure SSR and client use same timestamp
const now = DateTime.now()
  .set({
    second: Math.floor(DateTime.now().second / 10) * 10,
    millisecond: 0,
  })
  .toISO();

export const GET_CHANNEL_DOWNLOAD_COUNT = gql`
  query getChannelDownloadCount($uniqueName: String!) {
    channels(where: { uniqueName: { eq: $uniqueName } }) {
      uniqueName
      DiscussionChannelsConnection(
        where: {
          node: {
            AND: [
              { OR: [{ archived: { eq: false } }, { archived: { eq: null } }] }
              { NOT: { Discussion: null } }
              { Discussion: { hasDownload: { eq: true } } }
            ]
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_CHANNELS_DISCUSSIONS = gql`
  query getSortedChannelsDiscussions(
    $offset: Int
    $limit: Int
    $tags: [String]
    $searchInput: String
    $loggedInUsername: String
    $now: DateTime = "${now}"
  ) {
    getSortedChannels(
      offset: $offset
      limit: $limit
      tags: $tags
      searchInput: $searchInput
      countDownloads: false
    ) {
      channels {
        uniqueName
        displayName
        channelIconURL
        description
        isFavorited(username: $loggedInUsername)
        Tags {
          text
        }
        EventChannelsConnection(
          where: {
            node: {
              NOT: {
                archived: { eq: true },
                Event: null
              }
              Event: {
                canceled: { eq: false },
                endTime_GT: $now,
              }
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
        DiscussionChannelsConnection(
          where: {
            node: {
              AND: [
                { NOT: { archived: { eq: true } } },
                { NOT: { Discussion: null } },
                { NOT: {
                  Discussion: { hasDownload: { eq: true } }
                 } }
              ]
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
      }
      aggregateChannelCount
    }
  }
`;

export const GET_CHANNELS_DOWNLOADS = gql`
  query getSortedChannelsDownloads(
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
      countDownloads: true
    ) {
      channels {
        uniqueName
        DiscussionChannelsConnection(
          where: {
            node: {
              AND: [
                { NOT: { archived: { eq: true } } }
                { NOT: { Discussion: null } }
                { Discussion: { hasDownload: { eq: true } } }
              ]
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
      }
    }
  }
`;

export const GET_CHANNEL_CONTRIBUTIONS = gql`
  query getChannelContributions(
    $channelUniqueName: String!
    $startDate: String
    $endDate: String
    $year: Int
    $limit: Int
  ) {
    getChannelContributions(
      channelUniqueName: $channelUniqueName
      startDate: $startDate
      endDate: $endDate
      year: $year
      limit: $limit
    ) {
      username
      displayName
      profilePicURL
      totalContributions
      dayData {
        date
        count
        activities {
          id
          type
          description
          Comments {
            id
            text
            createdAt
            Channel {
              uniqueName
              displayName
              description
              channelIconURL
            }
            CommentAuthor {
              username
              profilePicURL
            }
            DiscussionChannel {
              id
              discussionId
              channelUniqueName
            }
          }
          Discussions {
            id
            title
            createdAt
            Author {
              username
              profilePicURL
            }
            DiscussionChannels {
              id
              channelUniqueName
              discussionId
            }
          }
        }
      }
    }
  }
`;

export const GET_USER_FAVORITE_CHANNELS = gql`
  query GetUserFavoriteChannels($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteChannels {
        displayName
        uniqueName
        channelIconURL
        eventsEnabled
      }
    }
  }
`;

export const GET_CHANNEL_PLUGIN_PIPELINES = gql`
  query GetChannelPluginPipelines($channelUniqueName: String!) {
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
      uniqueName
      displayName
      pluginPipelines
      Admins {
        username
      }
    }
  }
`;

export const GET_CHANNEL_PLUGIN_SETTINGS = gql`
  query GetChannelPluginSettings($channelUniqueName: String!, $now: DateTime) {
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
      uniqueName
      displayName
      Bots {
        username
        displayName
        botProfileId
        isDeprecated
        SuspensionsConnection(
          where: {
            node: {
              OR: [
                { suspendedIndefinitely: { eq: true } }
                { suspendedUntil_GT: $now }
              ]
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
      }
      EnabledPluginsConnection {
        edges {
          node {
            id
            version
            Plugin {
              id
              name
              displayName
              description
              tags
            }
          }
          properties {
            settingsJson
          }
        }
      }
    }
  }
`;
