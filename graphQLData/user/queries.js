import { gql } from "@apollo/client/core";

export const GET_USER_INFO_FOR_TAGS = gql`
  query getUser($username: String!) {
    getUser(username: $username) {
      profilePicURL
      PosterOfChannels {
        url
      }
      ModeratorOfChannels {
        url
      }
    }
  }
`;

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
      NotificationsAggregate(where: { read: false }) {
        count
      }
      CommentsAggregate(where: { NOT: { archived: true } }) {
        count
      }
      DiscussionsAggregate(where: { NOT: { hasDownload: true } }) {
        count
      }
      EventsAggregate {
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
      Comments(options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }) {
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
      Discussions(options: { sort: { createdAt: DESC } }) {
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

export const USER_LOOKUP = gql`
  query getUser($username: String!) {
    getUser(username: $username) {
      username
      displayName
      location
      pronouns
      bio
      profilePicURL
      ModeratorOfChannels {
        url
      }
      CommentsAggregate {
        count
      }
      DiscussionsAggregate {
        count
      }
      EventsAggregate {
        count
      }
      Comments {
        id
        DiscussionChannels {
          id
          discussionId
          channelUniqueName
          weightedVotesCount
          Discussion {
            id
            title
          }
        }
        isRootComment
        ParentComment {
          id
        }
        UserAuthor {
          username
        }
        text
        deleted
        createdDate
        editedDate
        Tags {
          text
        }
      }
      Events {
        id
        EventChannels {
          Channel {
            uniqueName
          }
        }
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
      }
      Discussions {
        id
        Channels {
          url
        }
        title
        body
        createdDate
        Author {
          username
        }
        Tags {
          text
        }
        ChannelsAggregate {
          count
        }
        DiscussionChannels {
          id
          weightedVotesCount
          discussionId
          channelUniqueName
          CommentsAggregate {
            count
          }
          Discussion {
            id
          }
          Channel {
            url
          }
        }
      }
    }
  }
`;

export const GET_USERS = gql`
  query {
    queryUser {
      username
      profilePicURL
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
