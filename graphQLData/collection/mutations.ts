import { gql } from '@apollo/client/core';

export const CREATE_COLLECTION = gql`
  mutation CreateCollection(
    $name: String!
    $description: String
    $collectionType: CollectionType!
    $visibility: CollectionVisibility!
    $updatedAt: DateTime!
    $username: String!
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
          CreatedBy: { connect: { where: { node: { username: $username } } } }
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
    addToCollection(
      input: { collectionId: $collectionId, itemId: $itemId, itemType: DISCUSSION }
    )
  }
`;

export const ADD_COMMENT_TO_COLLECTION = gql`
  mutation AddCommentToCollection($collectionId: ID!, $itemId: ID!) {
    addToCollection(
      input: { collectionId: $collectionId, itemId: $itemId, itemType: COMMENT }
    )
  }
`;

export const ADD_IMAGE_TO_COLLECTION = gql`
  mutation AddImageToCollection($collectionId: ID!, $itemId: ID!) {
    addToCollection(
      input: { collectionId: $collectionId, itemId: $itemId, itemType: IMAGE }
    )
  }
`;

export const ADD_CHANNEL_TO_COLLECTION = gql`
  mutation AddChannelToCollection($collectionId: ID!, $itemId: ID!) {
    addToCollection(
      input: { collectionId: $collectionId, itemId: $itemId, itemType: CHANNEL }
    )
  }
`;

export const REMOVE_DISCUSSION_FROM_COLLECTION = gql`
  mutation RemoveDiscussionFromCollection($collectionId: ID!, $itemId: ID!) {
    removeFromCollection(
      collectionId: $collectionId
      itemId: $itemId
      itemType: DISCUSSION
    )
  }
`;

export const REMOVE_COMMENT_FROM_COLLECTION = gql`
  mutation RemoveCommentFromCollection($collectionId: ID!, $itemId: ID!) {
    removeFromCollection(
      collectionId: $collectionId
      itemId: $itemId
      itemType: COMMENT
    )
  }
`;

export const REMOVE_IMAGE_FROM_COLLECTION = gql`
  mutation RemoveImageFromCollection($collectionId: ID!, $itemId: ID!) {
    removeFromCollection(
      collectionId: $collectionId
      itemId: $itemId
      itemType: IMAGE
    )
  }
`;

export const REMOVE_CHANNEL_FROM_COLLECTION = gql`
  mutation RemoveChannelFromCollection($collectionId: ID!, $itemId: ID!) {
    removeFromCollection(
      collectionId: $collectionId
      itemId: $itemId
      itemType: CHANNEL
    )
  }
`;

export const ADD_DOWNLOAD_TO_COLLECTION = gql`
  mutation AddDownloadToCollection($collectionId: ID!, $itemId: ID!) {
    addToCollection(
      input: { collectionId: $collectionId, itemId: $itemId, itemType: DOWNLOAD }
    )
  }
`;

export const REMOVE_DOWNLOAD_FROM_COLLECTION = gql`
  mutation RemoveDownloadFromCollection($collectionId: ID!, $itemId: ID!) {
    removeFromCollection(
      collectionId: $collectionId
      itemId: $itemId
      itemType: DOWNLOAD
    )
  }
`;

export const UPDATE_COLLECTION = gql`
  mutation UpdateCollection(
    $collectionId: ID!
    $name: String
    $description: String
    $visibility: CollectionVisibility
  ) {
    updateCollections(
      where: { id: $collectionId }
      update: {
        name: $name
        description: $description
        visibility: $visibility
      }
    ) {
      collections {
        id
        name
        description
        visibility
        updatedAt
      }
    }
  }
`;

export const DELETE_COLLECTION = gql`
  mutation DeleteCollection($collectionId: ID!) {
    deleteCollections(where: { id: $collectionId }) {
      nodesDeleted
    }
  }
`;

export const REORDER_COLLECTION_ITEM = gql`
  mutation ReorderCollectionItem(
    $collectionId: ID!
    $itemId: ID!
    $newPosition: Int!
  ) {
    reorderCollectionItem(
      collectionId: $collectionId
      itemId: $itemId
      newPosition: $newPosition
    )
  }
`;
