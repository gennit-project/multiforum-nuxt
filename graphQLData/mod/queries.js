import { gql } from "@apollo/client/core";

export const COUNT_OPEN_ISSUES = gql`
  query countOpenIssues($channelUniqueName: String!) {
    issuesAggregate(where: { channelUniqueName: $channelUniqueName, isOpen: true }) {
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
    issuesAggregate(where: { channelUniqueName: $channelUniqueName, isOpen: false }) {
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
      }
      AuthoredIssuesAggregate {
        count
      }
      ActivityFeedAggregate {
        count
      }
      AuthoredComments(options: { limit: 25, offset: 0, sort: { createdAt: DESC } }) {
        id
        text
        createdAt
        updatedAt
        deleted
        archived
        CommentAuthor {
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
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
      AuthoredIssues(options: { limit: 25, offset: 0, sort: { createdAt: DESC } }) {
        id
        title
        createdAt
        updatedAt
        isOpen
        Author {
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
          }
        }
        Channel {
          uniqueName
        }
      }
    }
  }
`;

export const GET_MOD_COMMENTS = gql`
  query getModComments($displayName: String!, $offset: Int!, $limit: Int!) {
    moderationProfiles(where: { displayName: $displayName }) {
      displayName
      AuthoredComments(options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }) {
        id
        text
        createdAt
        updatedAt
        deleted
        archived
        CommentAuthor {
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
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
      AuthoredIssues(options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }) {
        id
        title
        createdAt
        updatedAt
        isOpen
        Author {
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
          }
        }
        Channel {
          uniqueName
        }
      }
    }
  }
`;

export const GET_SUSPENDED_MODS_BY_CHANNEL = gql`
  query getModsByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      SuspendedModsAggregate {
        count
      }
      SuspendedMods {
        id
        username
        createdAt
        suspendedUntil
        suspendedIndefinitely
        SuspendedMod {
          displayName
        }
        RelatedIssue {
          id
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
        User {
          username
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
        commentKarma
        discussionKarma
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
        commentKarma
        discussionKarma
      }
    }
  }
`;

export const GET_PENDING_CHANNEL_MODS_BY_CHANNEL = gql`
  query getPendingChannelModsByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      PendingModInvites {
        username
        displayName
        createdAt
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

export const GET_DISCUSSION_CHANNEL = gql`
  query getDiscussionChannelID($discussionId: ID!, $channelUniqueName: String!) {
    discussionChannels(
      where: { discussionId: $discussionId, channelUniqueName: $channelUniqueName }
    ) {
      id
      archived
    }
  }
`;

export const GET_DISCUSSION_ISSUE = gql`
  query getDiscussionChannels($discussionChannelId: ID!) {
    discussionChannels(where: { id: $discussionChannelId }) {
      id
      RelatedIssues {
        id
      }
    }
  }
`;

export const GET_EVENT_ISSUE = gql`
  query getEventChannels($eventChannelId: ID!) {
    eventChannels(where: { id: $eventChannelId }) {
      id
      RelatedIssues {
        id
      }
    }
  }
`;

export const GET_EVENT_CHANNEL = gql`
  query getEventChannelID($eventId: ID!, $channelUniqueName: String!) {
    eventChannels(where: { eventId: $eventId, channelUniqueName: $channelUniqueName }) {
      id
      archived
    }
  }
`;

export const IS_ORIGINAL_POSTER_SUSPENDED = gql`
  query getSuspension($issueId: String!) {
    isOriginalPosterSuspended(issueId: $issueId)
  }
`;

export const GET_SUSPENDED_USERS_IN_CHANNEL = gql`
  query getChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      SuspendedUsersAggregate {
        count
      }
      SuspendedUsers {
        id
        username
        createdAt
        suspendedUntil
        suspendedIndefinitely
        SuspendedUser {
          username
        }
        RelatedIssue {
          id
        }
      }
    }
  }
`;

export const GET_COMMENT_ISSUE = gql`
  query getCommentIssue($commentId: ID!) {
    comments(where: { id: $commentId }) {
      id
      RelatedIssues {
        id
      }
    }
  }
`;
