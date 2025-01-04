import { gql } from "@apollo/client/core";
import { ISSUE_FIELDS } from "./queries";

export const REPORT_CONTENT = gql`
  mutation reportContent($input: [IssueCreateInput!]!) {
    createIssues(input: $input) {
      issues {
        title
        relatedDiscussionId
        relatedCommentId
        relatedEventId
        channelUniqueName
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
  mutation updateIssue(
    $issueWhere: IssueWhere!
    $updateIssueInput: IssueUpdateInput!
  ) {
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
              ModerationProfile: {
                connect: { where: { node: { displayName: $displayName } } }
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

export const ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT = gql`
  ${ISSUE_FIELDS}
  mutation addIssueActivityFeedItemWithComment(
    $issueId: ID!
    $actionDescription: String!
    $actionType: String!
    $displayName: String!
    $commentText: String!
    $channelUniqueName: String!
  ) {
    updateIssues(
      where: { id: $issueId }
      create: {
        ActivityFeed: [
          {
            node: {
              actionDescription: $actionDescription
              actionType: $actionType
              ModerationProfile: {
                connect: { where: { node: { displayName: $displayName } } }
              }
              Comment: {
                create: {
                  node: {
                    isRootComment: false
                    text: $commentText
                    Channel: {
                      connect: {
                        where: { node: { uniqueName: $channelUniqueName } }
                      }
                    }
                    Issue: { connect: { where: { node: { id: $issueId } } } }
                    CommentAuthor: {
                      ModerationProfile: {
                        connect: {
                          where: { node: { displayName: $displayName } }
                        }
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
