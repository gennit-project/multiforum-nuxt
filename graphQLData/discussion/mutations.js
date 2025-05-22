import { gql } from "@apollo/client/core";

export const CREATE_SIGNED_STORAGE_URL = gql`
  mutation createSignedURL($filename: String!, $contentType: String!) {
    createSignedStorageURL(filename: $filename, contentType: $contentType) {
      url
    }
  }
`;

export const CREATE_IMAGE = gql`
  mutation createImage(
    $url: String!
    $alt: String
    $caption: String
    $copyright: String
    $username: String!
  ) {
    createImages(
      input: [
        {
          url: $url
          alt: $alt
          caption: $caption
          copyright: $copyright
          hasSensitiveContent: false
          hasSpoiler: false
          Uploader: { connect: { where: { node: { username: $username } } } }
        }
      ]
    ) {
      images {
        id
        url
        alt
        caption
        copyright
        Uploader {
          username
        }
      }
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
  mutation createDiscussion($input: [DiscussionCreateInputWithChannels!]!) {
    createDiscussionWithChannelConnections(input: $input) {
      id
      title
      body
      DiscussionChannels {
        id
        archived
        answered
        locked
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
export const UPDATE_DISCUSSION = gql`
  mutation updateDiscussion(
    $where: DiscussionWhere!
    $updateDiscussionInput: DiscussionUpdateInput!
  ) {
    updateDiscussions(where: $where, update: $updateDiscussionInput) {
      discussions {
        id
        title
        body
        createdAt
        updatedAt
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
            copyright
          }
        }
        PastTitleVersions(options: { sort: [{ createdAt: DESC }] }) {
          id
          Author {
            username
          }
          body
          createdAt
        }
        PastBodyVersions(options: { sort: [{ createdAt: DESC }] }) {
          id
          Author {
            username
          }
          body
          createdAt
        }
      }
    }
  }
`;
export const UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS = gql`
  mutation updateDiscussionWithChannelConnections(
    $updateDiscussionInput: DiscussionUpdateInput!
    $where: DiscussionWhere!
    $channelConnections: [String!]
    $channelDisconnections: [String!]
  ) {
    updateDiscussionWithChannelConnections(
      discussionUpdateInput: $updateDiscussionInput
      where: $where
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
        archived
        answered
        locked
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
    $discussionChannelId: ID!
  ) {
    createComments(
      input: [
        {
          isRootComment: true
          isFeedbackComment: true
          text: $text
          Channel: { connect: { where: { node: { uniqueName: $channelId } } } }
          DiscussionChannel: { connect: { where: { node: { id: $discussionChannelId } } } }
          CommentAuthor: {
            ModerationProfile: { connect: { where: { node: { displayName: $modProfileName } } } }
          }
          GivesFeedbackOnDiscussion: { connect: { where: { node: { id: $discussionId } } } }
        }
      ]
    ) {
      comments {
        id
        isRootComment
        isFeedbackComment
        createdAt
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
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

export const MARK_AS_ANSWERED = gql`
  mutation markAsAnswered($channelId: String!, $discussionId: ID!) {
    updateDiscussionChannels(
      where: { channelUniqueName: $channelId, discussionId: $discussionId }
      update: { answered: true }
    ) {
      discussionChannels {
        id
        answered
        Answers {
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
        }
      }
    }
  }
`;

export const MARK_AS_ANSWERED_BY_COMMENT = gql`
  mutation markAsAnswered($commentId: ID!, $channelId: String!, $discussionId: ID!) {
    updateDiscussionChannels(
      where: { channelUniqueName: $channelId, discussionId: $discussionId }
      update: { answered: true, Answers: { connect: [{ where: { node: { id: $commentId } } }] } }
    ) {
      discussionChannels {
        id
        answered
        Answers {
          id
          text
          CommentAuthor {
            ... on User {
              username
            }
          }
        }
      }
    }
  }
`;

export const MARK_AS_UNANSWERED = gql`
  mutation markAsUnAnswered($channelId: String!, $discussionId: ID!) {
    updateDiscussionChannels(
      where: { channelUniqueName: $channelId, discussionId: $discussionId }
      update: { Answers: { disconnect: [{ where: { node: { NOT: null } } }] } }
    ) {
      discussionChannels {
        id
        answered
        Answers {
          id
          text
          CommentAuthor {
            ... on User {
              username
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_IMAGE = gql`
  mutation updateImage($imageId: ID!, $caption: String) {
    updateImages(where: { id: $imageId }, update: { caption: $caption }) {
      images {
        id
        caption
        url
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
