import { gql } from '@apollo/client/core';

export const CREATE_COLLECTION = gql`
  mutation CreateCollection(
    $name: String!
    $description: String
    $collectionType: CollectionType!
    $visibility: CollectionVisibility!
    $updatedAt: DateTime!
  ) {
    createCollections(
      input: [
        {
          name: $name
          description: $description
          collectionType: $collectionType
          visibility: $visibility
          itemOrder: []
          updatedAt: $updatedAt
          CreatedBy: {
            connect: {
              where: { node: {} }
            }
          }
        }
      ]
    ) {
      collections {
        id
        name
        description
        collectionType
        visibility
        itemCount
        createdAt
        updatedAt
      }
    }
  }
`;

export const ADD_DISCUSSION_TO_COLLECTION = gql`
  mutation AddDiscussionToCollection($collectionId: ID!, $itemId: ID!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        itemOrder_PUSH: [$itemId]
        Discussions: {
          connect: {
            where: { node: { id: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const ADD_COMMENT_TO_COLLECTION = gql`
  mutation AddCommentToCollection($collectionId: ID!, $itemId: ID!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        itemOrder_PUSH: [$itemId]
        Comments: {
          connect: {
            where: { node: { id: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const ADD_IMAGE_TO_COLLECTION = gql`
  mutation AddImageToCollection($collectionId: ID!, $itemId: ID!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        itemOrder_PUSH: [$itemId]
        Images: {
          connect: {
            where: { node: { id: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const ADD_CHANNEL_TO_COLLECTION = gql`
  mutation AddChannelToCollection($collectionId: ID!, $itemId: String!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        itemOrder_PUSH: [$itemId]
        Channels: {
          connect: {
            where: { node: { uniqueName: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const REMOVE_DISCUSSION_FROM_COLLECTION = gql`
  mutation RemoveDiscussionFromCollection($collectionId: ID!, $itemId: ID!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        Discussions: {
          disconnect: {
            where: { node: { id: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const REMOVE_COMMENT_FROM_COLLECTION = gql`
  mutation RemoveCommentFromCollection($collectionId: ID!, $itemId: ID!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        Comments: {
          disconnect: {
            where: { node: { id: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const REMOVE_IMAGE_FROM_COLLECTION = gql`
  mutation RemoveImageFromCollection($collectionId: ID!, $itemId: ID!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        Images: {
          disconnect: {
            where: { node: { id: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;

export const REMOVE_CHANNEL_FROM_COLLECTION = gql`
  mutation RemoveChannelFromCollection($collectionId: ID!, $itemId: String!) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        Channels: {
          disconnect: {
            where: { node: { uniqueName: $itemId } }
          }
        }
      }
    ) {
      collections {
        id
        name
        itemCount
        itemOrder
      }
    }
  }
`;