import { gql } from "@apollo/client/core";
import { ISSUE_FIELDS } from "./queries";

export const CLOSE_ISSUE = gql`
  mutation closeIssue($id: ID!) {
    updateIssues(where: { id: $id }, update: { isOpen: false }) {
      issues {
        id
        title
        isOpen
      }
    }
  }
`;

export const REOPEN_ISSUE = gql`
  mutation reopenIssue($id: ID!) {
    updateIssues(where: { id: $id }, update: { isOpen: true }) {
      issues {
        id
        title
        isOpen
      }
    }
  }
`;

export const UPDATE_ISSUE = gql`
  ${ISSUE_FIELDS}
  mutation updateIssue($issueWhere: IssueWhere!, $updateIssueInput: IssueUpdateInput!) {
    updateIssues(where: $issueWhere, update: $updateIssueInput) {
      issues {
        ...IssueFields
      }
    }
  }
`;

export const ADD_ISSUE_ACTIVITY_FEED_ITEM = gql`
  ${ISSUE_FIELDS}
  mutation addIssueActivityFeedItem(
    $issueId: ID!
    $actionDescription: String!
    $actionType: String!
    $displayName: String!
  ) {
    updateIssues(
      where: { id: $issueId }
      create: {
        ActivityFeed: [
          {
            node: {
              actionDescription: $actionDescription
              actionType: $actionType
              ModerationProfile: { connect: { where: { node: { displayName: $displayName } } } }
            }
          }
        ]
      }
    ) {
      issues {
        ...IssueFields
      }
    }
  }
`;

export const ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD = gql`
  ${ISSUE_FIELDS}
  mutation addIssueActivityFeedItemWithCommentAsMod(
    $issueId: ID!
    $actionDescription: String!
    $actionType: String!
    $displayName: String!
    $commentText: String!
    $channelUniqueName: String!
    $flaggedServerRuleViolation: Boolean
  ) {
    updateIssues(
      where: { id: $issueId }
      update: { flaggedServerRuleViolation: $flaggedServerRuleViolation }
      create: {
        ActivityFeed: [
          {
            node: {
              actionDescription: $actionDescription
              actionType: $actionType
              ModerationProfile: { connect: { where: { node: { displayName: $displayName } } } }
              Comment: {
                create: {
                  node: {
                    isRootComment: false
                    text: $commentText
                    Channel: { connect: { where: { node: { uniqueName: $channelUniqueName } } } }
                    Issue: { connect: { where: { node: { id: $issueId } } } }
                    CommentAuthor: {
                      ModerationProfile: {
                        connect: { where: { node: { displayName: $displayName } } }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ) {
      issues {
        ...IssueFields
      }
    }
  }
`;

export const ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER = gql`
  ${ISSUE_FIELDS}
  mutation addIssueActivityFeedItemWithCommentAsUser(
    $issueId: ID!
    $actionDescription: String!
    $actionType: String!
    $username: String!
    $commentText: String!
    $channelUniqueName: String!
    $flaggedServerRuleViolation: Boolean
  ) {
    updateIssues(
      where: { id: $issueId }
      update: { flaggedServerRuleViolation: $flaggedServerRuleViolation }
      create: {
        ActivityFeed: [
          {
            node: {
              actionDescription: $actionDescription
              actionType: $actionType
              User: { connect: { where: { node: { username: $username } } } }
              Comment: {
                create: {
                  node: {
                    isRootComment: false
                    text: $commentText
                    Channel: { connect: { where: { node: { uniqueName: $channelUniqueName } } } }
                    Issue: { connect: { where: { node: { id: $issueId } } } }
                    CommentAuthor: {
                      User: { connect: { where: { node: { username: $username } } } }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ) {
      issues {
        ...IssueFields
      }
    }
  }
`;

export const REPORT_DISCUSSION = gql`
  mutation reportDiscussion(
    $discussionId: ID!
    $reportText: String!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $channelUniqueName: String!
  ) {
    reportDiscussion(
      discussionId: $discussionId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
    }
  }
`;

export const ARCHIVE_DISCUSSION = gql`
  mutation archiveDiscussion(
    $discussionId: ID!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $reportText: String!
    $channelUniqueName: String!
  ) {
    archiveDiscussion(
      discussionId: $discussionId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
    }
  }
`;

export const UNARCHIVE_DISCUSSION = gql`
  mutation unarchiveDiscussion(
    $discussionId: ID!
    $channelUniqueName: String!
    $explanation: String!
  ) {
    unarchiveDiscussion(
      discussionId: $discussionId
      channelUniqueName: $channelUniqueName
      explanation: $explanation
    ) {
      id
    }
  }
`;

export const REPORT_EVENT = gql`
  mutation reportEvent(
    $eventId: ID!
    $reportText: String!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $channelUniqueName: String!
  ) {
    reportEvent(
      eventId: $eventId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
    }
  }
`;

export const UNARCHIVE_EVENT = gql`
  mutation unarchiveEvent($eventId: ID!, $channelUniqueName: String!, $explanation: String!) {
    unarchiveEvent(
      eventId: $eventId
      channelUniqueName: $channelUniqueName
      explanation: $explanation
    ) {
      id
    }
  }
`;

export const ARCHIVE_EVENT = gql`
  mutation archiveEvent(
    $eventId: ID!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $reportText: String!
    $channelUniqueName: String!
  ) {
    archiveEvent(
      eventId: $eventId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
    }
  }
`;

export const REPORT_COMMENT = gql`
  mutation reportComment(
    $commentId: ID!
    $reportText: String!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $channelUniqueName: String!
  ) {
    reportComment(
      commentId: $commentId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
      channelUniqueName: $channelUniqueName
    ) {
      id
    }
  }
`;

export const ARCHIVE_COMMENT = gql`
  mutation archiveComment(
    $commentId: ID!
    $selectedForumRules: [String!]!
    $selectedServerRules: [String!]!
    $reportText: String!
  ) {
    archiveComment(
      commentId: $commentId
      reportText: $reportText
      selectedForumRules: $selectedForumRules
      selectedServerRules: $selectedServerRules
    ) {
      id
    }
  }
`;

export const UNARCHIVE_COMMENT = gql`
  mutation unarchiveComment($commentId: ID!, $explanation: String!) {
    unarchiveComment(commentId: $commentId, explanation: $explanation) {
      id
    }
  }
`;
