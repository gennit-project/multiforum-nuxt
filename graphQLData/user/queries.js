import { gql } from "@apollo/client/core";

// This gets a reactive variable in the Apollo cache.
export const GET_LOCAL_USERNAME = gql`
  query getLocalUsername {
    username @client
  }
`;

export const GET_LOCAL_MOD_PROFILE_NAME = gql`
  query getLocalModProfileName {
    modProfileName @client
  }
`;

export const GET_USER_INFO_FOR_TAGS = gql`
  query getUser($username: String!) {
    getUser(username: $username) {
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
      CommentsAggregate {
        count
      }
      DiscussionsAggregate {
        count
      }
      EventsAggregate {
        count
      }
      ServerRoles {
        showAdminTag
      }
    }
  }
`;

export const GET_USER_COMMENTS = gql`
  query getUserComments($username: String!, $offset: Int!, $limit: Int!) {
    users(where: { username: $username }) {
      username
      Comments(options: { limit: $limit, offset: $offset }) {
        id
        text
        createdAt
        updatedAt
        deleted
        weightedVotesCount
        ParentComment {
          id
        }
        CommentAuthor {
          ... on User {
            username
            profilePicURL
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
      Discussions {
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
      Events {
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
    }
  }
`;
