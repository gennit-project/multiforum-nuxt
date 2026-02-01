import { COMMENT_VOTE_FIELDS } from '../comment/queries';
import { gql } from '@apollo/client/core';

export const ISSUE_FIELDS = gql`
  # ${COMMENT_VOTE_FIELDS}
  fragment IssueFields on Issue {
    id
    issueNumber
    title
    body
    isOpen
    createdAt
    updatedAt
    relatedCommentId
    relatedDiscussionId
    relatedEventId
    channelUniqueName
    Author {
      __typename
      ... on ModerationProfile {
        displayName
      }
      ... on User {
        username
      }
    }
    flaggedServerRuleViolation
    ActivityFeed(options: { sort: { createdAt: DESC } }) {
      ... on ModerationAction {
        id
        actionDescription
        actionType
        createdAt
        ModerationProfile {
          displayName
        }
        User {
          username
        }
        Revision {
          id
          body
          createdAt
          Author {
            username
          }
        }
        Comment {
          id
          text
          emoji
          weightedVotesCount
          createdAt
          updatedAt
          Issue {
            id
          }
          CommentAuthor {
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
          ChildCommentsAggregate {
            count
          }
          ParentComment {
            id
          }
          editReason
          PastVersions(options: { sort: [{ createdAt: DESC }] }) {
            id
            body
            createdAt
            Author {
              username
            }
          }
          ...CommentVoteFields
        }
      }
    }
    ActivityFeedAggregate(where: { actionType: "report" }) {
      count
    }
  }
`;

export const GET_ISSUE = gql`
  ${ISSUE_FIELDS}
  query getIssue($channelUniqueName: String!, $issueNumber: Int!) {
    issues(
      where: {
        channelUniqueName: $channelUniqueName
        issueNumber: $issueNumber
      }
    ) {
      ...IssueFields
    }
  }
`;

export const CHECK_DISCUSSION_ISSUE_EXISTENCE = gql`
  query getIssue($discussionId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedDiscussionId: $discussionId
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
      issueNumber
      flaggedServerRuleViolation
    }
  }
`;

export const CHECK_EVENT_ISSUE_EXISTENCE = gql`
  query getIssue($eventId: ID!, $channelUniqueName: String!) {
    issues(
      where: { relatedEventId: $eventId, channelUniqueName: $channelUniqueName }
    ) {
      id
      issueNumber
      flaggedServerRuleViolation
    }
  }
`;

export const CHECK_DISCUSSION_COMMENT_ISSUE_EXISTENCE = gql`
  query getDiscussionCommentIssue(
    $discussionId: ID!
    $channelUniqueName: String!
  ) {
    discussionChannels(
      where: {
        discussionId: $discussionId
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
      Comments(where: { RelatedIssues_SOME: {} }, options: { limit: 1 }) {
        id
        RelatedIssues {
          issueNumber
        }
      }
    }
  }
`;

export const GET_ISSUES_BY_CHANNEL = gql`
  query getIssuesByChannel($channelUniqueName: String!, $searchInput: String) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Issues(
        where: {
          isOpen: true
          OR: [
            { title_MATCHES: $searchInput }
            { body_MATCHES: $searchInput }
          ]
        }
        options: { sort: { createdAt: DESC } }
      ) {
        id
        issueNumber
        title
        body
        Author {
          __typename
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
          }
        }
        createdAt
        updatedAt
        isOpen
        channelUniqueName
        relatedDiscussionId
        Channel {
          uniqueName
        }
        flaggedServerRuleViolation
        ActivityFeedAggregate(where: { actionType: "report" }) {
          count
        }
      }
    }
  }
`;

export const GET_CLOSED_ISSUES_BY_CHANNEL = gql`
  query getClosedIssuesByChannel($channelUniqueName: String!, $searchInput: String) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Issues(
        where: {
          isOpen: false
          OR: [
            { title_MATCHES: $searchInput }
            { body_MATCHES: $searchInput }
          ]
        }
        options: { sort: { createdAt: DESC } }
      ) {
        id
        issueNumber
        title
        body
        Author {
          __typename
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
          }
        }
        createdAt
        updatedAt
        isOpen
        channelUniqueName
        relatedDiscussionId
        Channel {
          uniqueName
        }
        flaggedServerRuleViolation
        ActivityFeedAggregate(where: { actionType: "report" }) {
          count
        }
      }
    }
  }
`;

export const GET_ISSUES = gql`
  query getIssues($issueWhere: IssueWhere) {
    issues(where: $issueWhere, options: { sort: { createdAt: DESC } }) {
      id
      issueNumber
      title
      body
      isOpen
      createdAt
      updatedAt
      relatedCommentId
      relatedDiscussionId
      relatedEventId
      flaggedServerRuleViolation
      Channel {
        uniqueName
      }
      Author {
        __typename
        ... on ModerationProfile {
          displayName
        }
        ... on User {
          username
        }
      }
      ActivityFeedAggregate(where: { actionType: "report" }) {
        count
      }
    }
  }
`;

export const GET_CLOSED_ISSUES = gql`
  query getClosedIssues {
    issues(where: { isOpen: false }, options: { sort: { createdAt: DESC } }) {
      id
      issueNumber
      title
      body
      isOpen
      createdAt
      updatedAt
      relatedCommentId
      relatedDiscussionId
      relatedEventId
      Channel {
        uniqueName
      }
      channelUniqueName
      Author {
        __typename
        ... on ModerationProfile {
          displayName
        }
        ... on User {
          username
        }
      }
      ActivityFeedAggregate(where: { actionType: "report" }) {
        count
      }
    }
  }
`;
