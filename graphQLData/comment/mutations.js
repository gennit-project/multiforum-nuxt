import { gql } from '@apollo/client/core';
import { COMMENT_FIELDS } from './queries';

export const ADD_EMOJI_TO_COMMENT = gql`
  mutation addEmojiToComment(
    $commentId: ID!
    $emojiLabel: String!
    $unicode: String!
    $username: String!
  ) {
    addEmojiToComment(
      commentId: $commentId
      emojiLabel: $emojiLabel
      unicode: $unicode
      username: $username
    ) {
      id
      emoji
    }
  }
`;

export const REMOVE_EMOJI_FROM_COMMENT = gql`
  mutation removeEmojiFromComment(
    $commentId: ID!
    $emojiLabel: String!
    $username: String!
  ) {
    removeEmojiFromComment(
      commentId: $commentId
      emojiLabel: $emojiLabel
      username: $username
    ) {
      id
      emoji
    }
  }
`;

export const UPVOTE_COMMENT = gql`
  mutation upvoteComment($id: ID!, $username: String!) {
    upvoteComment(commentId: $id, username: $username) {
      id
      weightedVotesCount
      UpvotedByUsers {
        username
      }
      UpvotedByUsersAggregate {
        count
      }
      SuperUpvotedByUsers {
        username
      }
    }
  }
`;

export const UNDO_UPVOTE_COMMENT = gql`
  mutation undoUpvoteComment($id: ID!, $username: String!) {
    undoUpvoteComment(commentId: $id, username: $username) {
      id
      weightedVotesCount
      UpvotedByUsers {
        username
      }
      UpvotedByUsersAggregate {
        count
      }
      SuperUpvotedByUsers {
        username
      }
    }
  }
`;

// The created comment is written directly into the Apollo cache for the
// comment-display queries (GET_COMMENT_REPLIES, GET_DISCUSSION_COMMENTS,
// GET_COMMENT_AND_REPLIES). It must therefore return every field those queries
// select via the shared CommentFields fragment — otherwise Apollo writes an
// incomplete entry ("Missing field ... while writing result") and the new
// comment fails to render until a refetch. The extra Channel/role/ChildComments
// selections below cover fields a few consumers read beyond the fragment.
export const CREATE_COMMENT = gql`
  mutation createComment($createCommentInput: [CommentCreateInput!]!) {
    createComments(input: $createCommentInput) {
      comments {
        ...CommentFields
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on User {
            displayName
            ChannelRoles {
              name
            }
            ServerRoles {
              name
            }
          }
          ... on ModerationProfile {
            createdAt
          }
        }
        FeedbackComments {
          id
        }
        ChildComments {
          id
          text
        }
      }
    }
  }
  ${COMMENT_FIELDS}
`;

export const UPDATE_COMMENT = gql`
  mutation updateComment(
    $updateCommentInput: CommentUpdateInput
    $commentWhere: CommentWhere
  ) {
    updateComments(update: $updateCommentInput, where: $commentWhere) {
      comments {
        id
        text
        CommentAuthor {
          ... on User {
            username
          }
          ... on ModerationProfile {
            displayName
          }
        }
        createdAt
        updatedAt
        emoji
        weightedVotesCount
        UpvotedByUsers {
          username
        }
        UpvotedByUsersAggregate {
          count
        }
        FeedbackComments {
          id
          CommentAuthor {
            ... on ModerationProfile {
              displayName
            }
            ... on User {
              username
            }
          }
        }
        FeedbackCommentsAggregate {
          count
        }
      }
    }
  }
`;

export const SOFT_DELETE_COMMENT = gql`
  mutation updateComments($id: ID!) {
    updateComments(
      update: { text: "[Deleted]" }
      disconnect: {
        CommentAuthor: { User: { where: { node_NOT: { username: "null" } } } }
      }
      where: { id: $id }
    ) {
      comments {
        id
        text
        CommentAuthor {
          ... on User {
            username
          }
        }
        weightedVotesCount
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_COMMENT = gql`
  mutation deleteComment($id: ID!) {
    deleteComments(where: { id: $id }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const SUBSCRIBE_TO_COMMENT = gql`
  mutation subscribeToComment($commentId: ID!) {
    subscribeToComment(commentId: $commentId) {
      id
      SubscribedToNotifications {
        username
      }
    }
  }
`;

export const UNSUBSCRIBE_FROM_COMMENT = gql`
  mutation unsubscribeFromComment($commentId: ID!) {
    unsubscribeFromComment(commentId: $commentId) {
      id
      SubscribedToNotifications {
        username
      }
    }
  }
`;

export const STICKY_COMMENT = gql`
  mutation stickyComment($commentId: ID!) {
    stickyComment(commentId: $commentId) {
      id
      isSticky
      stickyAt
      stickyByUsername
    }
  }
`;

export const UNSTICKY_COMMENT = gql`
  mutation unstickyComment($commentId: ID!) {
    unstickyComment(commentId: $commentId) {
      id
      isSticky
      stickyAt
      stickyByUsername
    }
  }
`;

export const ADD_FEEDBACK_COMMENT_TO_COMMENT = gql`
  mutation addFeedbackCommentToComment(
    $modProfileName: String!
    $text: String!
    $commentId: ID!
    $channelId: String!
  ) {
    createComments(
      input: [
        {
          isRootComment: true
          isFeedbackComment: true
          text: $text
          CommentAuthor: {
            ModerationProfile: {
              connect: { where: { node: { displayName: $modProfileName } } }
            }
          }
          Channel: { connect: { where: { node: { uniqueName: $channelId } } } }
          GivesFeedbackOnComment: {
            connect: { where: { node: { id: $commentId } } }
          }
        }
      ]
    ) {
      comments {
        id
        isRootComment
        isFeedbackComment
        CommentAuthor {
          ... on ModerationProfile {
            displayName
            createdAt
          }
          ... on User {
            username
            createdAt
          }
        }
        createdAt
        text
        FeedbackComments {
          id
        }
      }
    }
  }
`;

export const DELETE_COMMENT_REVISION = gql`
  mutation deleteCommentRevision($textVersionId: ID!) {
    deleteCommentRevision(textVersionId: $textVersionId) {
      id
      body
      editReason
      createdAt
      updatedAt
      Author {
        username
      }
    }
  }
`;
