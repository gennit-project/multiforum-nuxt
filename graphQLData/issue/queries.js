import { COMMENT_VOTE_FIELDS } from "../comment/queries";
import { gql } from "@apollo/client/core";

export const ISSUE_FIELDS = gql`
  ${COMMENT_VOTE_FIELDS}
  fragment IssueFields on Issue {
    id
    title
    body
    isOpen
    createdAt
    updatedAt
    relatedCommentId
    relatedDiscussionId
    relatedEventId
    Author {
      ... on ModerationProfile {
        displayName
      }
    }
    ActivityFeed (
      options: {
        sort: {
          createdAt: DESC
        }
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
        Comment {
          id
          text
          emoji
          weightedVotesCount
          createdAt
          updatedAt
          CommentAuthor {
            ... on ModerationProfile {
              displayName
            }
          }
          ChildCommentsAggregate {
            count
          }
          ParentComment {
            id
          }
          ...CommentVoteFields
        }
      }
    }
  }
`;

export const GET_ISSUE = gql`
  ${ISSUE_FIELDS}
  query getIssue($id: ID!) {
    issues(where: { id: $id }) {
      ...IssueFields,
    }
  }
`;

export const CHECK_DISCUSSION_ISSUE_EXISTENCE = gql`
  query getIssue($discussionId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedDiscussionId: $discussionId,
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
    }
  }
`;

export const CHECK_EVENT_ISSUE_EXISTENCE = gql`
  query getIssue($eventId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedEventId: $eventId,
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
    }
  }
`

export const CHECK_COMMENT_ISSUE_EXISTENCE = gql`
  query getIssue($commentId: ID!, $channelUniqueName: String!) {
    issues(
      where: {
        relatedCommentId: $commentId,
        channelUniqueName: $channelUniqueName
      }
    ) {
      id
    }
  }
`
export const GET_ISSUES_BY_DISCUSSION = gql`
  query getIssuesByDiscussion($discussionId: ID!) {
    discussions(where: { id: $discussionId }) {
      id
      title
      RelatedIssues {
        title
        Author {
          ... on ModerationProfile {
            displayName
          }
        }
      }
    }
  }
`;

export const GET_ISSUES_BY_CHANNEL = gql`
  query getIssuesByChannel($channelUniqueName: String!) {
    channels(where: { 
      uniqueName: $channelUniqueName,
    }) {
      uniqueName
      Issues (
        where: {
          isOpen: true
        }
      ) {
        id
        title
        body
        Author {
          ... on ModerationProfile {
            displayName
          }
        }
        createdAt
        updatedAt
        isOpen
        relatedDiscussionId
      }
    }
  }
`;

export const GET_CLOSED_ISSUES_BY_CHANNEL = gql`
  query getClosedIssuesByChannel($channelUniqueName: String!) {
    channels(where: { 
      uniqueName: $channelUniqueName,
    }) {
      uniqueName
      Issues (
        where: {
          isOpen: false
        }
      ) {
        id
        title
        body
        Author {
          ... on ModerationProfile {
            displayName
          }
        }
        createdAt
        updatedAt
        isOpen
        relatedDiscussionId
      }
    }
  }
`;

export const GET_ISSUES_BY_MOD = gql`
  query getIssuesByMod {
    moderationProfiles(
      where: { displayName: "miniatureDeafeningMysteriousTeacher" }
    ) {
      displayName
      AuthoredIssues {
        title
      }
    }
  }
`;

export const GET_ISSUES_BY_SERVER = gql`
  query getIssues {
    issues {
      id
      title
      authorName
      Author {
        ... on ModerationProfile {
          displayName
        }
      }
      relatedDiscussionId
      RelatedDiscussion {
        title
      }
      channelUniqueName
      Channel {
        uniqueName
      }
    }
  }
`;

export const GET_ISSUES_BY_EVENT = gql`
  query getIssuesByEvent {
    events(where: { id: "d081532a-8f07-48ed-8786-40e8dcc309c2" }) {
      id
      title
      RelatedIssues {
        title
        Author {
          ... on ModerationProfile {
            displayName
          }
        }
      }
    }
  }
`;

export const GET_ISSUES_BY_COMMENT = gql`
  query getIssuesByComment {
    comments(where: { id: "cc153e03-62a4-41fa-9597-46e6795e7fc3" }) {
      id
      text
      RelatedIssues {
        title
        Author {
          ... on ModerationProfile {
            displayName
          }
        }
      }
    }
  }
`;
