import { gql } from '@apollo/client/core';

export const COUNT_OPEN_ISSUES = gql`
  query countOpenIssues($channelUniqueName: String!) {
    issuesConnection(
      where: { channelUniqueName: { eq: $channelUniqueName }, isOpen: { eq: true } }
    ) {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
`;

export const SERVER_SCOPED_ISSUE_COUNT = gql`
  query countIssuesByServer($issueWhere: IssueWhere) {
    issuesConnection(where: $issueWhere) {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
`;

export const COUNT_CLOSED_ISSUES = gql`
  query countClosedIssues($channelUniqueName: String!) {
    issuesConnection(
      where: { channelUniqueName: { eq: $channelUniqueName }, isOpen: { eq: false } }
    ) {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
`;

export const SERVER_SCOPED_CLOSED_ISSUE_COUNT = gql`
  query countClosedIssuesByServer($issueWhere: IssueWhere) {
    issuesConnection(where: $issueWhere) {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
`;

export const GET_MOD = gql`
  query getMod($displayName: String!) {
    moderationProfiles(where: { displayName: { eq: $displayName } }) {
      displayName
      createdAt
      AuthoredCommentsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AuthoredIssuesConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      ActivityFeedConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      AuthoredComments(
        limit: 25, offset: 0, sort: { createdAt: DESC }
      ) {
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
      AuthoredIssues(
        limit: 25, offset: 0, sort: { createdAt: DESC }
      ) {
        id
        issueNumber
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
    moderationProfiles(where: { displayName: { eq: $displayName } }) {
      displayName
      AuthoredComments(
        limit: $limit, offset: $offset, sort: { createdAt: DESC }
      ) {
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
    moderationProfiles(where: { displayName: { eq: $displayName } }) {
      displayName
      AuthoredIssues(
        limit: $limit, offset: $offset, sort: { createdAt: DESC }
      ) {
        id
        issueNumber
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

export const GET_MOD_CONTRIBUTIONS = gql`
  query getModContributions($displayName: String!, $year: Int) {
    getModContributions(displayName: $displayName, year: $year) {
      date
      count
      activities {
        id
        actionType
        actionDescription
        createdAt
        Issue {
          id
          issueNumber
          channelUniqueName
          relatedDiscussionId
          relatedEventId
          relatedCommentId
          title
          isOpen
        }
        Comment {
          id
          text
          createdAt
        }
        RelatedDiscussion {
          id
          title
          createdAt
          DiscussionChannels {
            id
            discussionId
            channelUniqueName
          }
        }
        RelatedEvent {
          id
          title
          createdAt
          EventChannels {
            id
            eventId
            channelUniqueName
          }
        }
        RelatedComment {
          id
          text
          createdAt
          DiscussionChannel {
            id
            discussionId
            channelUniqueName
          }
          Event {
            id
            title
            createdAt
            EventChannels {
              id
              eventId
              channelUniqueName
            }
          }
        }
      }
    }
  }
`;

export const GET_SUSPENDED_MODS_BY_CHANNEL = gql`
  query getModsByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
      uniqueName
      SuspendedModsConnection {
        aggregate {
          count {
            nodes
          }
        }
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
          issueNumber
        }
      }
    }
  }
`;

export const GET_MODS_BY_CHANNEL = gql`
  query getModsByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
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
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
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
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
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
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
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
    channels(where: { uniqueName: { eq: $channelId } }) {
      uniqueName
      PendingOwnerInvites(where: { username: { eq: $username } }) {
        username
      }
    }
  }
`;

export const PENDING_FORUM_MOD_INVITE_EXISTS = gql`
  query pendingModInviteExists($channelId: String!, $username: String!) {
    channels(where: { uniqueName: { eq: $channelId } }) {
      uniqueName
      PendingModInvites(where: { username: { eq: $username } }) {
        username
      }
    }
  }
`;

export const GET_DISCUSSION_CHANNEL = gql`
  query getDiscussionChannelID(
    $discussionId: ID!
    $channelUniqueName: String!
  ) {
    discussionChannels(
      where: {
        discussionId: { eq: $discussionId }
        channelUniqueName: { eq: $channelUniqueName }
      }
    ) {
      id
      archived
    }
  }
`;

export const GET_DISCUSSION_ISSUE = gql`
  query getDiscussionChannels($discussionChannelId: ID!) {
    discussionChannels(where: { id: { eq: $discussionChannelId } }) {
      id
      RelatedIssues {
        id
        issueNumber
      }
    }
  }
`;

export const GET_EVENT_ISSUE = gql`
  query getEventChannels($eventChannelId: ID!) {
    eventChannels(where: { id: { eq: $eventChannelId } }) {
      id
      RelatedIssues {
        id
        issueNumber
      }
    }
  }
`;

export const GET_EVENT_CHANNEL = gql`
  query getEventChannelID($eventId: ID!, $channelUniqueName: String!) {
    eventChannels(
      where: { eventId: { eq: $eventId }, channelUniqueName: { eq: $channelUniqueName } }
    ) {
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
    channels(where: { uniqueName: { eq: $channelUniqueName } }) {
      uniqueName
      SuspendedUsersConnection {
        aggregate {
          count {
            nodes
          }
        }
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
          issueNumber
        }
      }
    }
  }
`;

export const GET_COMMENT_ISSUE = gql`
  query getCommentIssue($commentId: ID!) {
    comments(where: { id: { eq: $commentId } }) {
      id
      RelatedIssues {
        id
        issueNumber
      }
    }
  }
`;
