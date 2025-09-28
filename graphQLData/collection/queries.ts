import { gql } from '@apollo/client/core';

export const GET_USER_COLLECTIONS = gql`
  query GetUserCollections(
    $username: String!
    $collectionType: CollectionType!
    $searchTerm: String
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          name_CONTAINS: $searchTerm
        }
        options: {
          sort: [{ createdAt: DESC }]
        }
      ) {
        id
        name
        description
        collectionType
        visibility
        itemCount
        createdAt
        updatedAt
      }
      ${getFavoriteFieldByType()}
    }
  }
`;

export const GET_COLLECTION_ITEMS = gql`
  query GetCollectionItems($collectionId: ID!) {
    collections(where: { id: $collectionId }) {
      id
      name
      description
      collectionType
      itemOrder
      Discussions {
        id
        title
        createdAt
      }
      Comments {
        id
        text
        createdAt
      }
      Downloads {
        id
        title
        createdAt
      }
      Images {
        id
        url
        alt
        caption
        createdAt
      }
      Channels {
        id
        displayName
        uniqueName
        createdAt
      }
    }
  }
`;

export const CHECK_ITEM_IN_COLLECTIONS = gql`
  query CheckItemInCollections(
    $username: String!
    $itemId: ID!
    $collectionType: CollectionType!
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          ${getCollectionItemFilter()}
        }
      ) {
        id
        name
        collectionType
      }
    }
  }
`;

// Helper function to get the appropriate favorite field based on collection type
function getFavoriteFieldByType() {
  return `
    FavoriteDiscussions {
      id
      title
    }
    FavoriteComments {
      id
      text
    }
    FavoriteImages {
      id
      url
      alt
      caption
    }
    FavoriteChannels {
      id
      displayName
      uniqueName
    }
  `;
}

// Helper function to get the appropriate collection item filter
function getCollectionItemFilter() {
  return `
    OR: [
      { Discussions_SOME: { id: $itemId } }
      { Comments_SOME: { id: $itemId } }
      { Downloads_SOME: { id: $itemId } }
      { Images_SOME: { id: $itemId } }
      { Channels_SOME: { id: $itemId } }
    ]
  `;
}