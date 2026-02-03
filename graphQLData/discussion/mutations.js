import { gql } from '@apollo/client/core';

export const CREATE_SIGNED_STORAGE_URL = gql`
  mutation createSignedURL($filename: String!, $contentType: String!) {
    createSignedStorageURL(filename: $filename, contentType: $contentType) {
      url
    }
  }
`;

export const CREATE_IMAGE = gql`
  mutation createImage(
    $url: String
    $alt: String
    $caption: String
    $copyright: String
    $albumId: ID
  ) {
    createImageWithUploader(
      input: {
        url: $url
        alt: $alt
        caption: $caption
        copyright: $copyright
        albumId: $albumId
      }
    ) {
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
`;

export const CREATE_DOWNLOADABLE_FILE = gql`
  mutation createDownloadableFile(
    $fileName: String!
    $url: String!
    $kind: FileKind!
    $size: Int
    $priceModel: PriceModel!
    $priceCents: Int
    $priceCurrency: String
  ) {
    createDownloadableFiles(
      input: [
        {
          fileName: $fileName
          url: $url
          kind: $kind
          size: $size
          priceModel: $priceModel
          priceCents: $priceCents
          priceCurrency: $priceCurrency
        }
      ]
    ) {
      downloadableFiles {
        id
        fileName
        url
        kind
        size
        priceModel
        priceCents
        priceCurrency
        license {
          id
          name
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
          DiscussionChannel: {
            connect: { where: { node: { id: $discussionChannelId } } }
          }
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
  mutation markAsAnswered(
    $commentId: ID!
    $channelId: String!
    $discussionId: ID!
  ) {
    updateDiscussionChannels(
      where: { channelUniqueName: $channelId, discussionId: $discussionId }
      update: {
        answered: true
        Answers: { connect: [{ where: { node: { id: $commentId } } }] }
      }
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

export const UNMARK_COMMENT_AS_ANSWER = gql`
  mutation unmarkCommentAsAnswer(
    $commentId: ID!
    $channelId: String!
    $discussionId: ID!
  ) {
    updateDiscussionChannels(
      where: { channelUniqueName: $channelId, discussionId: $discussionId }
      update: {
        Answers: { disconnect: [{ where: { node: { id: $commentId } } }] }
      }
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

export const UPDATE_IMAGE = gql`
  mutation updateImage($imageId: ID!, $caption: String, $alt: String) {
    updateImages(where: { id: $imageId }, update: { caption: $caption, alt: $alt }) {
      images {
        id
        caption
        alt
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

export const SUBSCRIBE_TO_DISCUSSION_CHANNEL = gql`
  mutation subscribeToDiscussionChannel($discussionChannelId: ID!) {
    subscribeToDiscussionChannel(discussionChannelId: $discussionChannelId) {
      id
      SubscribedToNotifications {
        username
      }
    }
  }
`;

export const UNSUBSCRIBE_FROM_DISCUSSION_CHANNEL = gql`
  mutation unsubscribeFromDiscussionChannel($discussionChannelId: ID!) {
    unsubscribeFromDiscussionChannel(
      discussionChannelId: $discussionChannelId
    ) {
      id
      SubscribedToNotifications {
        username
      }
    }
  }
`;

export const UPDATE_DISCUSSION_SENSITIVE_CONTENT = gql`
  mutation updateDiscussionSensitiveContent(
    $discussionId: ID!
    $hasSensitiveContent: Boolean!
  ) {
    updateDiscussions(
      where: { id: $discussionId }
      update: { hasSensitiveContent: $hasSensitiveContent }
    ) {
      discussions {
        id
        hasSensitiveContent
      }
    }
  }
`;

export const UPDATE_DISCUSSION_CHANNEL_LABELS = gql`
  mutation updateDiscussionChannelLabels(
    $channelUniqueName: String!
    $discussionId: ID!
    $labelOptionIds: [ID!]!
  ) {
    updateDiscussionChannels(
      where: {
        channelUniqueName: $channelUniqueName
        discussionId: $discussionId
      }
      update: {
        LabelOptions: {
          connect: { where: { node: { id_IN: $labelOptionIds } } }
          disconnect: { where: { node: { NOT: { id_IN: $labelOptionIds } } } }
        }
      }
    ) {
      discussionChannels {
        id
        LabelOptions {
          id
          value
          displayName
          order
          group {
            id
            key
            displayName
          }
        }
      }
    }
  }
`;

// mutation {
//   createFilterGroups(input: [{
//     key: "lot_size",
//     displayName: "Lot Size",
//     mode: INCLUDE,
//     order: 1,
//     channel: { connect: { where: { node: { uniqueName: "sims4_builds" }}} },
//     options: {
//       create: [
//         { node: { value: "10x20", displayName: "10x20", order: 1 }},
//         { node: { value: "20x30", displayName: "20x30", order: 2 }}
//       ]
//     }
//   }]) {
//     filterGroups { id }
//   }
// }
