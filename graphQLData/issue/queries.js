import { COMMENT_VOTE_FIELDS } from '../comment/queries';
import { gql } from '@apollo/client/core';

export const ISSUE_BASE_FIELDS = gql`
  fragment IssueBaseFields on Issue {
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
    relatedImageId
    relatedWikiPageId
    relatedWikiRevisionId
    relatedChannelUniqueName
    relatedModProfileName
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
    SubscribedToNotifications {
      username
    }
    locked
    lockedAt
    lockReason
    LockedBy {
      displayName
    }
  }
`;

export const ISSUE_FIELDS = gql`
  ${ISSUE_BASE_FIELDS}
  ${COMMENT_VOTE_FIELDS}
  fragment IssueFields on Issue {
    ...IssueBaseFields
    ActivityFeed(sort: { createdAt: DESC }) {
      ... on ModerationAction {
        id
        actionDescription
        actionType
        createdAt
        recommendedAction
        recommendationConfidence
        recommendationRationale
        ModerationProfile {
          displayName
          User {
            isBot
          }
        }
        User {
          username
          isBot
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
          ChildCommentsConnection {
            aggregate {
              count {
                nodes
              }
            }
          }
          ParentComment {
            id
          }
          editReason
          PastVersions(sort: [{ createdAt: DESC }]) {
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
    ActivityFeedConnection(where: { node: { actionType: { eq: "report" } } }) {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
`;

export const GET_ISSUE = gql`
  ${ISSUE_BASE_FIELDS}
  query getIssue($channelUniqueName: String!, $issueNumber: Int!) {
    issues(
      where: {
        channelUniqueName: { eq: $channelUniqueName }
        issueNumber: { eq: $issueNumber }
      }
    ) {
      ...IssueBaseFields
    }
  }
`;

export const GET_ISSUE_ACTIVITY = gql`
  ${COMMENT_VOTE_FIELDS}
  query getIssueActivity(
    $channelUniqueName: String!
    $issueNumber: Int!
    $activityFeedLimit: Int
    $activityFeedOffset: Int
  ) {
    issues(
      where: {
        channelUniqueName: { eq: $channelUniqueName }
        issueNumber: { eq: $issueNumber }
      }
    ) {
      id
      ActivityFeed(
        sort: { createdAt: DESC }
        limit: $activityFeedLimit
        offset: $activityFeedOffset
      ) {
        ... on ModerationAction {
          id
          actionDescription
          actionType
          createdAt
          recommendedAction
          recommendationConfidence
          recommendationRationale
          ModerationProfile {
            displayName
            User {
              isBot
            }
          }
          User {
            username
            isBot
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
            ChildCommentsConnection {
              aggregate {
                count {
                  nodes
                }
              }
            }
            ParentComment {
              id
            }
            editReason
            PastVersions(sort: [{ createdAt: DESC }]) {
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
      ActivityFeedConnection(where: { node: { actionType: { eq: "report" } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const CHECK_DISCUSSION_ISSUE_EXISTENCE = gql`
  query getIssue($discussionId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedDiscussionId: { eq: $discussionId }
        channelUniqueName: { eq: $channelUniqueName }
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
      where: {
        relatedEventId: { eq: $eventId }
        channelUniqueName: { eq: $channelUniqueName }
      }
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
        discussionId: { eq: $discussionId }
        channelUniqueName: { eq: $channelUniqueName }
      }
    ) {
      id
      Comments(where: { RelatedIssues_SOME: {} }, limit: 1) {
        id
        RelatedIssues {
          issueNumber
        }
      }
    }
  }
`;

export const GET_SITE_WIDE_ISSUE_LIST = gql`
  query getSiteWideIssueList(
    $searchInput: String
    $selectedChannels: [String!]
    $startDate: String
    $endDate: String
    $showOnlyServerRuleViolations: Boolean
    $isOpen: Boolean!
    $filterCreatedByMe: Boolean
    $filterIAmOP: Boolean
    $filterIReported: Boolean
    $options: IssueListOptions
  ) {
    getSiteWideIssueList(
      searchInput: $searchInput
      selectedChannels: $selectedChannels
      startDate: $startDate
      endDate: $endDate
      showOnlyServerRuleViolations: $showOnlyServerRuleViolations
      isOpen: $isOpen
      filterCreatedByMe: $filterCreatedByMe
      filterIAmOP: $filterIAmOP
      filterIReported: $filterIReported
      options: $options
    ) {
      aggregateIssueCount
      issues {
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
        relatedImageId
        relatedWikiPageId
        relatedWikiRevisionId
        relatedUsername
        flaggedServerRuleViolation
        locked
        lockReason
        channelUniqueName
        channelIconURL
        authorName
        reportCount
      }
    }
  }
`;

export const GET_CHANNEL_REPORTS = gql`
  query getChannelReports($isOpen: Boolean) {
    issues(
      where: {
        channelUniqueName: { eq: null }
        NOT: { relatedChannelUniqueName: { eq: null } }
        isOpen: { eq: $isOpen }
      }
      sort: { createdAt: DESC }
    ) {
      id
      issueNumber
      title
      body
      isOpen
      createdAt
      updatedAt
      relatedChannelUniqueName
      flaggedServerRuleViolation
      locked
      lockedAt
      lockReason
      LockedBy {
        displayName
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
      ActivityFeedConnection(where: { node: { actionType: { eq: "report" } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_IMAGE_REPORTS = gql`
  query getImageReports($isOpen: Boolean) {
    issues(
      where: {
        OR: [
          { NOT: { relatedImageId: { eq: null } } }
          { NOT: { relatedProfilePicUserId: { eq: null } } }
          { NOT: { relatedChannelIconName: { eq: null } } }
          { NOT: { relatedChannelBannerName: { eq: null } } }
        ]
        isOpen: { eq: $isOpen }
      }
      sort: { createdAt: DESC }
    ) {
      id
      issueNumber
      title
      body
      isOpen
      createdAt
      updatedAt
      channelUniqueName
      relatedImageId
      relatedAlbumId
      relatedProfilePicUserId
      relatedChannelIconName
      relatedChannelBannerName
      relatedChannelUniqueName
      flaggedServerRuleViolation
      Author {
        __typename
        ... on ModerationProfile {
          displayName
        }
        ... on User {
          username
        }
      }
      ActivityFeedConnection(where: { node: { actionType: { eq: "report" } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;
