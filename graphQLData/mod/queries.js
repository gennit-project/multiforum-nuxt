import { gql } from "@apollo/client/core";

export const COUNT_OPEN_ISSUES = gql`
  query countOpenIssues($channelUniqueName: String!) {
    issuesAggregate(
      where: { channelUniqueName: $channelUniqueName, isOpen: true }
    ) {
      count
    }
  }
`;

export const SERVER_SCOPED_ISSUE_COUNT = gql`
  query countIssuesByServer {
    issuesAggregate(where: { isOpen: true }) {
      count
    }
  }
`;

export const COUNT_CLOSED_ISSUES = gql`
  query countClosedIssues($channelUniqueName: String!) {
    issuesAggregate(
      where: { channelUniqueName: $channelUniqueName, isOpen: false }
    ) {
      count
    }
  }
`;

export const SERVER_SCOPED_CLOSED_ISSUE_COUNT = gql`
  query countClosedIssuesByServer {
    issuesAggregate(where: { isOpen: false }) {
      count
    }
  }
`;

export const GET_MOD = gql`
  query getMod($displayName: String!) {
    moderationProfiles(where: { displayName: $displayName }) {
      displayName
      createdAt
      AuthoredCommentsAggregate {
        count
        __typename
      }
      AuthoredIssuesAggregate {
        count
        __typename
      }
      ActivityFeedAggregate {
        count
        __typename
      }
    }
  }
`;

export const GET_MOD_COMMENTS = gql`
  query getModComments($displayName: String!, $offset: Int!, $limit: Int!) {
    moderationProfiles(where: { displayName: $displayName }) {
      displayName
      AuthoredComments(
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
      ) {
        id
        text
        createdAt
        updatedAt
        deleted
        CommentAuthor {
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
        Channel {
          uniqueName
        }
        GivesFeedbackOnDiscussion {
          id
        }
        GivesFeedbackOnEvent {
          id
        }
        GivesFeedbackOnComment {
          id
        }
        Issue {
          id
        }
      }
    }
  }
`;

export const GET_MOD_ISSUES = gql`
  query getModIssues($displayName: String!, $offset: Int!, $limit: Int!) {
    moderationProfiles(where: { displayName: $displayName }) {
      displayName
      AuthoredIssues(
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
      ) {
        id
        title
        createdAt
        updatedAt
        isOpen
        Author {
          ... on ModerationProfile {
            displayName
          }
        }
        Channel {
          uniqueName
        }
      }
    }
  }
`;

export const GET_MODS_BY_CHANNEL = gql`
  query getModsByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Admins {
        username
        createdAt
        displayName
        profilePicURL
      }
      Moderators {
        displayName
        createdAt
        ModChannelRoles {
          name
          description
        }
      }
    }
  }
`;

export const GET_CHANNEL_OWNERS_BY_CHANNEL = gql`
  query getChannelOwnersByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Admins {
        username
        displayName
        createdAt
        profilePicURL
      }
    }
  }
`;

export const GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL = gql`
  query getPendingChannelOwnersByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      PendingOwnerInvites {
        username
        displayName
        createdAt
        profilePicURL
      }
    }
  }
`;

export const PENDING_FORUM_OWNER_INVITE_EXISTS = gql`
  query pendingInviteExists($channelId: String!, $username: String!) {
    channels(where: { uniqueName: $channelId }) {
      uniqueName
      PendingOwnerInvites(where: { username: $username }) {
        username
      }
    }
  }
`;

export const PENDING_FORUM_MOD_INVITE_EXISTS = gql`
  query pendingModInviteExists($channelId: String!, $username: String!) {
    channels(where: { uniqueName: $channelId }) {
      uniqueName
      PendingModInvites(where: { username: $username }) {
        username
      }
    }
  }
`;

export const ACCEPT_FORUM_OWNER_INVITE = gql`
  mutation acceptInviteForumOwner($channelId: String!) {
    acceptForumOwnerInvite(channelUniqueName: $channelId)
  }
`;
