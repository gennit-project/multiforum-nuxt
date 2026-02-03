import { gql } from '@apollo/client/core';

export const GET_USER = gql`
  query getBasicUserInfo($username: String!) {
    users(where: { username: $username }) {
      username
      commentKarma
      discussionKarma
      createdAt
      displayName
      profilePicURL
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
      notifyOnFeedback
      notificationBundleInterval
      notificationBundleEnabled
      notificationBundleContent
      enableSensitiveContentByDefault
      NotificationsAggregate(where: { read: false }) {
        count
      }
      CommentsAggregate(where: { NOT: { archived: true } }) {
        count
      }
      DiscussionsAggregate(
        where: { OR: [{ hasDownload: false }, { hasDownload: null }] }
      ) {
        count
      }
      DownloadsAggregate: DiscussionsAggregate(where: { hasDownload: true }) {
        count
      }
      EventsAggregate {
        count
      }
      ImagesAggregate {
        count
      }
      AlbumsAggregate {
        count
      }
      ServerRoles {
        showAdminTag
      }
      AdminOfChannelsAggregate {
        count
      }
    }
  }
`;

export const GET_USER_COMMENTS = gql`
  query getUserComments($username: String!, $offset: Int!, $limit: Int!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      Comments(
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
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
        UpvotedByUsersAggregate {
          count
        }
        UpvotedByUsers {
          username
        }
      }
    }
  }
`;

export const GET_USER_DISCUSSIONS = gql`
  query getUserDiscussions($username: String!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      Discussions(
        where: { OR: [{ hasDownload: false }, { hasDownload: null }] }
        options: { sort: { createdAt: DESC } }
      ) {
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
  query getUserDownloads($username: String!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      Discussions(
        where: { hasDownload: true }
        options: { sort: { createdAt: DESC } }
      ) {
        id
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
          ServerRoles {
            showAdminTag
          }
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
          CommentsAggregate {
            count
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

export const GET_USER_EVENTS = gql`
  query getUserEvents($username: String!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      Events(options: { sort: { createdAt: DESC } }) {
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

export const DOES_USER_EXIST = gql`
  query doesUserExist($username: String!) {
    users(where: { username: $username }) {
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
    users(where: { username: $username }) {
      username
      FavoriteChannels {
        uniqueName
        displayName
        description
        channelIconURL
        Tags {
          text
        }
      }
    }
  }
`;

export const GET_MODDED_CHANNELS = gql`
  query getModdedChannels($username: String!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      ModOfChannels {
        uniqueName
        description
        channelIconURL
        Tags {
          text
        }
        EventChannelsAggregate(where: { NOT: { Event: null } }) {
          count
        }
        DiscussionChannelsAggregate(where: { NOT: { Discussion: null } }) {
          count
        }
      }
      AdminOfChannelsAggregate {
        count
      }
    }
  }
`;

export const GET_OWNED_CHANNELS = gql`
  query getOwnedChannels($username: String!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      AdminOfChannels {
        uniqueName
        description
        channelIconURL
        Tags {
          text
        }
        EventChannelsAggregate(where: { NOT: { Event: null } }) {
          count
        }
        DiscussionChannelsAggregate(where: { NOT: { Discussion: null } }) {
          count
        }
      }
      AdminOfChannelsAggregate {
        count
      }
    }
  }
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
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Admins(where: { username: $username }) {
        username
      }
      SuspendedUsers(where: { username: $username }) {
        username
      }
      Moderators(where: { displayName: $modDisplayName }) {
        displayName
      }
      SuspendedMods(where: { modProfileName: $modDisplayName }) {
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
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      SuspendedUsers(where: { username: $username }) {
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
    users(where: { username: $username }) {
      username
      Suspensions(
        where: {
          OR: [
            { suspendedIndefinitely: true }
            { suspendedUntil_GT: $now }
          ]
        }
        options: { limit: 1, sort: { suspendedUntil: DESC } }
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
    users(where: { username: $username }) {
      username
      FavoriteChannelsAggregate {
        count
      }
      FavoriteImagesAggregate {
        count
      }
      FavoriteCommentsAggregate {
        count
      }
      FavoriteDiscussionsAggregate(
        where: { OR: [{ hasDownload: false }, { hasDownload: null }] }
      ) {
        count
      }
    }
  }
`;

export const GET_USER_FAVORITE_DOWNLOADS_COUNT = gql`
  query getUserFavoriteDownloadsCount($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteDiscussionsAggregate(where: { hasDownload: true }) {
        count
      }
    }
  }
`;
