import { gql } from "@apollo/client/core";

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
  mutation removeEmojiFromComment($commentId: ID!, $emojiLabel: String!, $username: String!) {
    removeEmojiFromComment(commentId: $commentId, emojiLabel: $emojiLabel, username: $username) {
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
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation createComment($createCommentInput: [CommentCreateInput!]!) {
    createComments(input: $createCommentInput) {
      comments {
        id
        text
        Channel {
          uniqueName
        }
        UpvotedByUsers {
          username
        }
        UpvotedByUsersAggregate {
          count
        }
        CommentAuthor {
          ... on User {
            username
            displayName
            createdAt
            discussionKarma
            profilePicURL
            commentKarma
            ChannelRoles {
              name
            }
            ServerRoles {
              name
            }
          }
          ... on ModerationProfile {
            displayName
            createdAt
          }
        }
        ParentComment {
          id
        }
        weightedVotesCount
        emoji
        createdAt
        updatedAt
        archived
        ChildCommentsAggregate {
          count
        }
        FeedbackComments {
          id
        }
        ChildComments {
          id
          text
          createdAt
          emoji
          weightedVotesCount
          CommentAuthor {
            ... on User {
              username
            }
            ... on ModerationProfile {
              displayName
            }
          }
          UpvotedByUsers {
            username
          }
          UpvotedByUsersAggregate {
            count
          }
        }
      }
    }
  }
`;

export const CREATE_DISCUSSION_CHANNEL = gql`
  mutation createDiscussionChannel(
    $createDiscussionChannelInput: [DiscussionChannelCreateInput!]!
  ) {
    createDiscussionChannels(input: $createDiscussionChannelInput) {
      discussionChannels {
        id
        channelUniqueName
        discussionId
        emoji
        archived
        answered
        locked
        Discussion {
          id
          title
        }
        Channel {
          uniqueName
        }
        CommentsAggregate {
          count
        }
        UpvotedByUsers {
          username
        }
        UpvotedByUsersAggregate {
          count
        }
        Comments {
          id
          text
          CommentAuthor {
            ... on User {
              username
            }
          }
          ChildCommentsAggregate {
            count
          }
          ChildComments {
            id
          }
          createdAt
          updatedAt
          weightedVotesCount
        }
      }
    }
  }
`;

export const UPDATE_COMMENT = gql`
  mutation updateComment($updateCommentInput: CommentUpdateInput, $commentWhere: CommentWhere) {
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
      disconnect: { CommentAuthor: { User: { where: { node_NOT: { username: "null" } } } } }
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
            ModerationProfile: { connect: { where: { node: { displayName: $modProfileName } } } }
          }
          Channel: { connect: { where: { node: { uniqueName: $channelId } } } }
          GivesFeedbackOnComment: { connect: { where: { node: { id: $commentId } } } }
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

export const DELETE_TEXT_VERSION = gql`
  mutation deleteTextVersion($id: ID!) {
    deleteTextVersions(where: { id: $id }) {
      nodesDeleted
    }
  }
`;
