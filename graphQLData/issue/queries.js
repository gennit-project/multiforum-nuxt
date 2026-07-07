import { COMMENT_VOTE_FIELDS } from '../comment/queries';
import { gql } from '@apollo/client/core';

export const ISSUE_BASE_FIELDS = gql`
  # ${COMMENT_VOTE_FIELDS}
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
  fragment IssueFields on Issue {
    ...IssueBaseFields
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
  ${ISSUE_BASE_FIELDS}
  query getIssue(
    $channelUniqueName: String!
    $issueNumber: Int!
    $activityFeedLimit: Int
    $activityFeedOffset: Int
  ) {
    issues(
      where: {
        channelUniqueName: $channelUniqueName
        issueNumber: $issueNumber
      }
    ) {
      ...IssueBaseFields
      ActivityFeed(
        options: {
          sort: { createdAt: DESC }
          limit: $activityFeedLimit
          offset: $activityFeedOffset
        }
      ) {
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
      relatedImageId
      relatedWikiPageId
      relatedWikiRevisionId
      relatedUsername
      flaggedServerRuleViolation
      locked
      lockedAt
      lockReason
      LockedBy {
        displayName
      }
      Channel {
        uniqueName
        channelIconURL
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
      relatedImageId
      relatedWikiPageId
      relatedWikiRevisionId
      Channel {
        uniqueName
        channelIconURL
      }
      channelUniqueName
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
      ActivityFeedAggregate(where: { actionType: "report" }) {
        count
      }
    }
  }
`;

export const GET_CHANNEL_REPORTS = gql`
  query getChannelReports($isOpen: Boolean) {
    issues(
      where: {
        channelUniqueName: null
        relatedChannelUniqueName_NOT: null
        isOpen: $isOpen
      }
      options: { sort: { createdAt: DESC } }
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
      ActivityFeedAggregate(where: { actionType: "report" }) {
        count
      }
    }
  }
`;

export const GET_IMAGE_REPORTS = gql`
  query getImageReports($isOpen: Boolean) {
    issues(
      where: {
        OR: [
          { relatedImageId_NOT: null }
          { relatedProfilePicUserId_NOT: null }
          { relatedChannelIconName_NOT: null }
          { relatedChannelBannerName_NOT: null }
        ]
        isOpen: $isOpen
      }
      options: { sort: { createdAt: DESC } }
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
      ActivityFeedAggregate(where: { actionType: "report" }) {
        count
      }
    }
  }
`;

export const GET_SERVER_ISSUE = gql`
  ${ISSUE_BASE_FIELDS}
  query getServerIssue(
    $issueNumber: Int!
    $activityFeedLimit: Int
    $activityFeedOffset: Int
  ) {
    issues(
      where: {
        channelUniqueName: null
        issueNumber: $issueNumber
      }
    ) {
      ...IssueBaseFields
      ActivityFeed(
        options: {
          sort: { createdAt: DESC }
          limit: $activityFeedLimit
          offset: $activityFeedOffset
        }
      ) {
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
  }
`;
