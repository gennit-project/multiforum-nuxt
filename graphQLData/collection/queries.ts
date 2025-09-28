import { gql } from '@apollo/client/core';

export const GET_USER_COLLECTIONS_DISCUSSIONS = gql`
  query GetUserCollectionsDiscussions($username: String!, $searchTerm: String) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: DISCUSSIONS, name_CONTAINS: $searchTerm }
        options: { sort: [{ createdAt: DESC }] }
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
      FavoriteDiscussions {
        id
        title
      }
    }
  }
`;

export const GET_USER_COLLECTIONS_COMMENTS = gql`
  query GetUserCollectionsComments($username: String!, $searchTerm: String) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: COMMENTS, name_CONTAINS: $searchTerm }
        options: { sort: [{ createdAt: DESC }] }
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
      FavoriteComments {
        id
        text
      }
    }
  }
`;

export const GET_USER_COLLECTIONS_IMAGES = gql`
  query GetUserCollectionsImages($username: String!, $searchTerm: String) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: IMAGES, name_CONTAINS: $searchTerm }
        options: { sort: [{ createdAt: DESC }] }
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
      FavoriteImages {
        id
        url
        alt
        caption
      }
    }
  }
`;

export const GET_USER_COLLECTIONS_CHANNELS = gql`
  query GetUserCollectionsChannels($username: String!, $searchTerm: String) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: CHANNELS, name_CONTAINS: $searchTerm }
        options: { sort: [{ createdAt: DESC }] }
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
      FavoriteChannels {
        displayName
        uniqueName
      }
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
