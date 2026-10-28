import { gql } from '@apollo/client/core';
import { AUTHOR_FIELDS, CHANNEL_ICON_FIELDS } from '../fragments';

export const GET_USER = gql`
  query getBasicUserInfo($username: String!) {
    getUserWikiEditsCount(username: $username)
    users(where: { username: { eq: $username } }) {
      ...AuthorFields
      location
      pronouns
      bio
      Email {
        address
      }
      notifyOnReplyToCommentByDefault
      notifyOnReplyToDiscussionByDefault
      notifyOnReplyToEventByDefault
      notifyWhenTagged
      notifyOnSubscribedIssueUpdates
      notifyOnFeedback
      notifyOnSuspensionBlocks
      notificationBundleInterval
      notificationBundleEnabled
      notificationBundleContent
      enableSensitiveContentByDefault
      NotificationsConnection(where: { node: { read: { eq: false } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
      CommentsConnection(where: { node: { NOT: { archived: { eq: true } } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
      DiscussionsConnection(
        where: {
          node: { OR: [{ hasDownload: { eq: false } }, { hasDownload: null }] }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      DownloadsConnection: DiscussionsConnection(
        where: { node: { hasDownload: { eq: true } } }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      EventsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      ImagesConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AlbumsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AuthoredWikiPageVersionsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AdminOfChannelsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
  ${AUTHOR_FIELDS}
`;

// Public profile data only. Keep owner-only account fields (email, notification
// preferences, and content settings) in GET_USER so anonymous visitors and
// other users can load profile sidebars without triggering authorization errors.
export const GET_PUBLIC_USER_PROFILE = gql`
  query getPublicUserProfile($username: String!) {
    getUserWikiEditsCount(username: $username)
    users(where: { username: { eq: $username } }) {
      ...AuthorFields
      location
      pronouns
      bio
      CommentsConnection(where: { node: { NOT: { archived: { eq: true } } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
      DiscussionsConnection(
        where: {
          node: { OR: [{ hasDownload: { eq: false } }, { hasDownload: null }] }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      DownloadsConnection: DiscussionsConnection(
        where: { node: { hasDownload: { eq: true } } }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      EventsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      ImagesConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AlbumsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AuthoredWikiPageVersionsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AdminOfChannelsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      ModOfChannelsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
  ${AUTHOR_FIELDS}
`;

export const GET_USER_COMMENTS = gql`
  query getUserComments(
    $username: String!
    $offset: Int!
    $limit: Int!
    $where: CommentWhere
  ) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      CommentsConnection(where: { node: $where }) {
        aggregate {
          count {
            nodes
          }
        }
      }
      Comments(
        where: $where
        limit: $limit
        offset: $offset
        sort: { createdAt: DESC }
      ) {
        id
        text
        createdAt
        updatedAt
        deleted
        archived
        weightedVotesCount
        ParentComment {
          id
        }
        CommentAuthor {
          ... on User {
            username
            profilePicURL
          }
          ... on ModerationProfile {
            displayName
          }
        }
        DiscussionChannel {
          id
          Channel {
            uniqueName
          }
          discussionId
          channelUniqueName
        }
        Event {
          id
          title
          EventChannels {
            channelUniqueName
          }
        }
        Channel {
          uniqueName
        }
        UpvotedByUsersConnection {
          aggregate {
            count {
              nodes
            }
          }
        }
        UpvotedByUsers {
          username
        }
      }
    }
  }
`;

export const GET_USER_DISCUSSIONS = gql`
  query getUserDiscussions($username: String!, $where: DiscussionWhere) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      Discussions(where: $where, sort: { createdAt: DESC }) {
        id
        Author {
          username
          commentKarma
          discussionKarma
          createdAt
        }
        title
        body
        createdAt
        updatedAt
        deleted
        hasDownload
        DiscussionChannels {
          archived
          answered
          locked
          Channel {
            uniqueName
          }
          weightedVotesCount
          id
          discussionId
          channelUniqueName
        }
        Tags {
          text
        }
      }
    }
  }
`;

export const GET_USER_DOWNLOADS = gql`
  query getUserDownloads($username: String!, $where: DiscussionWhere) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      Discussions(where: $where, sort: { createdAt: DESC }) {
        id
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        title
        body
        createdAt
        updatedAt
        deleted
        hasDownload
        hasSensitiveContent
        DiscussionChannels {
          archived
          answered
          locked
          Channel {
            uniqueName
          }
          CommentsConnection {
            aggregate {
              count {
                nodes
              }
            }
          }
          weightedVotesCount
          id
          discussionId
          channelUniqueName
        }
        Tags {
          text
        }
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
          }
        }
      }
    }
  }
`;

export const GET_USER_OWNED_DOWNLOADS = gql`
  query getUserOwnedDownloads($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      OwnedDownloads(
        where: { hasDownload: { eq: true } }
        sort: { createdAt: DESC }
      ) {
        id
        title
        body
        createdAt
        updatedAt
        hasDownload
        isFavorited(username: $username)
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          locked
          weightedVotesCount
          Channel {
            uniqueName
            displayName
          }
          CommentsConnection {
            aggregate {
              count {
                nodes
              }
            }
          }
        }
        Tags {
          text
        }
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
          }
        }
        hasSensitiveContent
      }
    }
  }
`;

export const GET_USER_OWNED_DOWNLOADS_COUNT = gql`
  query getUserOwnedDownloadsCount($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      OwnedDownloadsConnection(where: { node: { hasDownload: { eq: true } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_UPLOADED_DOWNLOADABLE_FILES = gql`
  query getUploadedDownloadableFiles($username: String!) {
    getUploadedDownloadableFiles(username: $username) {
      discussion {
        id
        title
        createdAt
        updatedAt
        channelUniqueNames
      }
      files {
        id
        fileName
        kind
        size
        url
        uploadedAt
        createdAt
      }
    }
  }
`;

export const GET_USER_EVENTS = gql`
  query getUserEvents($username: String!, $where: EventWhere) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      Events(where: $where, sort: { createdAt: DESC }) {
        id
        title
        startTime
        endTime
        locationName
        address
        virtualEventUrl
        location {
          latitude
          longitude
        }
        Poster {
          username
        }
        Tags {
          text
        }
        createdAt
        updatedAt
        deleted
        EventChannels {
          channelUniqueName
          Channel {
            uniqueName
          }
        }
      }
    }
  }
`;

export const GET_USER_WIKI_EDITS = gql`
  query getUserWikiEdits(
    $where: WikiPageWhere
    $versionWhere: TextVersionWhere
  ) {
    wikiPages(where: $where, sort: [{ updatedAt: DESC }]) {
      id
      title
      body
      editReason
      slug
      createdAt
      updatedAt
      channelUniqueName
      VersionAuthor {
        username
        displayName
        profilePicURL
      }
      PastVersions(
        where: $versionWhere
        sort: [{ createdAt: DESC }]
      ) {
        id
        body
        editReason
        createdAt
        Author {
          username
          displayName
          profilePicURL
        }
      }
    }
  }
`;

export const DOES_USER_EXIST = gql`
  query doesUserExist($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      Email {
        address
      }
    }
  }
`;

export const GET_USER_FAVORITE_CHANNELS = gql`
  query getUserFavoriteChannels($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteChannels {
        uniqueName
        displayName
        description
        ...ChannelIconFields
        Tags {
          text
        }
      }
    }
  }
  ${CHANNEL_ICON_FIELDS}
`;

export const GET_MODDED_CHANNELS = gql`
  query getModdedChannels($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      ModOfChannels {
        uniqueName
        description
        ...ChannelIconFields
        Tags {
          text
        }
        EventChannelsConnection(where: { node: { NOT: { Event: null } } }) {
          aggregate {
            count {
              nodes
            }
          }
        }
        DiscussionChannelsConnection(
          where: { node: { NOT: { Discussion: null } } }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
      }
      AdminOfChannelsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
  ${CHANNEL_ICON_FIELDS}
`;

export const GET_OWNED_CHANNELS = gql`
  query getOwnedChannels($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      AdminOfChannels {
        uniqueName
        description
        ...ChannelIconFields
        Tags {
          text
        }
        EventChannelsConnection(where: { node: { NOT: { Event: null } } }) {
          aggregate {
            count {
              nodes
            }
          }
        }
        DiscussionChannelsConnection(
          where: { node: { NOT: { Discussion: null } } }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
      }
      AdminOfChannelsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
  ${CHANNEL_ICON_FIELDS}
`;

export const GET_USER_CONTRIBUTIONS = gql`
  query getUserContributions($username: String!, $year: Int) {
    getUserContributions(username: $username, year: $year) {
      count
      date
      activities {
        id
        description
        type
        Comments {
          id
          text
          createdAt
          CommentAuthor {
            username
            ... on User {
              profilePicURL
            }
          }
          Channel {
            uniqueName
          }
          DiscussionChannel {
            id
            discussionId
            channelUniqueName
          }
          Event {
            id
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
        Events {
          id
          title
          createdAt
          Poster {
            username
          }
          EventChannels {
            id
            channelUniqueName
            eventId
          }
        }
        WikiEdits {
          id
          body
          editReason
          createdAt
          Author {
            username
            profilePicURL
          }
          WikiPage {
            id
            title
            slug
            channelUniqueName
          }
        }
      }
    }
  }
`;

export const USER_IS_MOD_OR_OWNER_IN_CHANNEL = gql`
  query userIsModInChannel(
    $modDisplayName: String!
    $username: String!
    $channelUniqueName: String!
  ) {
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
      uniqueName
      Admins(where: { username: { eq: $username } }) {
        username
      }
      SuspendedUsers(where: { username: { eq: $username } }) {
        username
      }
      Moderators(where: { displayName: { eq: $modDisplayName } }) {
        displayName
      }
      SuspendedMods(where: { modProfileName: { eq: $modDisplayName } }) {
        modProfileName
      }
    }
  }
`;

export const GET_USER_SUSPENSION_IN_CHANNEL = gql`
  query getUserSuspensionInChannel(
    $channelUniqueName: String!
    $username: String!
  ) {
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
      uniqueName
      SuspendedUsers(where: { username: { eq: $username } }) {
        id
        suspendedUntil
        suspendedIndefinitely
        RelatedIssue {
          issueNumber
        }
      }
    }
  }
`;

export const GET_USER_ACTIVE_SUSPENSIONS = gql`
  query getUserActiveSuspensions($username: String!, $now: DateTime!) {
    users(where: { username: { eq: $username } }) {
      username
      Suspensions(
        where: {
          OR: [
            { suspendedIndefinitely: { eq: true } }
            { suspendedUntil_GT: $now }
          ]
        }
        limit: 1
        sort: { suspendedUntil: DESC }
      ) {
        id
        channelUniqueName
        suspendedUntil
        suspendedIndefinitely
        RelatedIssue {
          issueNumber
        }
      }
    }
  }
`;

export const GET_USER_FAVORITE_COUNTS = gql`
  query getUserFavoriteCounts($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteChannelsConnection {
        totalCount
      }
      FavoriteImagesConnection {
        totalCount
      }
      FavoriteCommentsConnection {
        totalCount
      }
      FavoriteDiscussionsConnection(
        where: {
          node: { OR: [{ hasDownload: { eq: false } }, { hasDownload: null }] }
        }
      ) {
        totalCount
      }
      FavoriteDownloadsConnection: FavoriteDiscussionsConnection(
        where: { node: { hasDownload: { eq: true } } }
      ) {
        totalCount
      }
    }
  }
`;
