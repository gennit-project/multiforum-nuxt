import { gql } from "@apollo/client/core";

export const CREATE_SIGNED_STORAGE_URL = gql`
  mutation createSignedURL($filename: String!, $contentType: String!) {
    createSignedStorageURL(filename: $filename, contentType: $contentType) {
      url
    }
  }
`;

export const ADD_EMOJI_TO_DISCUSSION_CHANNEL = gql`
  mutation addEmojiToDiscussionChannel(
    $discussionChannelId: ID!
    $emojiLabel: String!
    $unicode: String!
    $username: String!
  ) {
    addEmojiToDiscussionChannel(
      discussionChannelId: $discussionChannelId
      emojiLabel: $emojiLabel
      unicode: $unicode
      username: $username
    ) {
      id
      emoji
    }
  }
`;

export const REMOVE_EMOJI_FROM_DISCUSSION_CHANNEL = gql`
  mutation removeEmojiFromDiscussionChannel(
    $discussionChannelId: ID!
    $emojiLabel: String!
    $username: String!
  ) {
    removeEmojiFromDiscussionChannel(
      discussionChannelId: $discussionChannelId
      emojiLabel: $emojiLabel
      username: $username
    ) {
      id
      emoji
    }
  }
`;

export const CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS = gql`
  mutation createDiscussion(
    $discussionCreateInput: DiscussionCreateInput
    $channelConnections: [String]
  ) {
    createDiscussionWithChannelConnections(
      discussionCreateInput: $discussionCreateInput
      channelConnections: $channelConnections
    ) {
      id
      title
      body
      DiscussionChannels {
        id
        id
        discussionId
        channelUniqueName
        CommentsAggregate {
          count
        }
        weightedVotesCount
        createdAt
        Channel {
          uniqueName
        }
        Discussion {
          id
        }
        UpvotedByUsers {
          username
        }
        UpvotedByUsersAggregate {
          count
        }
      }
      Author {
        username
      }
      createdAt
      updatedAt
      Tags {
        text
      }
    }
  }
`;

export const UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS = gql`
  mutation updateDiscussionWithChannelConnections(
    $updateDiscussionInput: DiscussionUpdateInput!
    $discussionWhere: DiscussionWhere!
    $channelConnections: [String!]
    $channelDisconnections: [String!]
  ) {
    updateDiscussionWithChannelConnections(
      discussionUpdateInput: $updateDiscussionInput
      where: $discussionWhere
      channelConnections: $channelConnections
      channelDisconnections: $channelDisconnections
    ) {
      id
      title
      body
      DiscussionChannels {
        id
        channelUniqueName
        discussionId
        Channel {
          uniqueName
        }
      }
      createdAt
      updatedAt
      Tags {
        text
      }
    }
  }
`;

export const DELETE_DISCUSSION = gql`
  mutation deleteDiscussion($id: ID!) {
    deleteDiscussions(where: { id: $id }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const UPVOTE_DISCUSSION_CHANNEL = gql`
  mutation upvoteDiscussionChannel($id: ID!, $username: String!) {
    upvoteDiscussionChannel(discussionChannelId: $id, username: $username) {
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

export const UNDO_UPVOTE_DISCUSSION_CHANNEL = gql`
  mutation undoUpvoteDiscussionChannel($id: ID!, $username: String!) {
    undoUpvoteDiscussionChannel(discussionChannelId: $id, username: $username) {
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

export const GIVE_FEEDBACK_ON_DISCUSSION = gql`
  mutation giveFeedbackOnDiscussion(
    $discussionId: ID!
    $modProfileName: String!
    $commentText: String!
    $channelUniqueName: String!
  ) {
    giveFeedbackOnDiscussion(
      discussionId: $discussionId
      modProfileName: $modProfileName
      commentText: $commentText
      channelUniqueName: $channelUniqueName
    ) {
      text
    }
  }
`;

export const ADD_FEEDBACK_COMMENT_TO_DISCUSSION = gql`
  mutation addFeedbackCommentToDiscussion(
    $modProfileName: String!
    $text: String!
    $discussionId: ID!
    $channelId: String!
  ) {
    createComments(
      input: [
        {
          isRootComment: true
          text: $text
          Channel: { connect: { where: { node: { uniqueName: $channelId } } } }
          CommentAuthor: {
            ModerationProfile: {
              connect: { where: { node: { displayName: $modProfileName } } }
            }
          }
          GivesFeedbackOnDiscussion: {
            connect: { where: { node: { id: $discussionId } } }
          }
        }
      ]
    ) {
      comments {
        id
        createdAt
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            displayName
          }
        }
        createdAt
        text
        GivesFeedbackOnDiscussion {
          id
        }
      }
    }
  }
`;
