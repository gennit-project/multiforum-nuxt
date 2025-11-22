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

export const GET_USER_COLLECTIONS_DOWNLOADS = gql`
  query GetUserCollectionsDownloads($username: String!, $searchTerm: String) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: DOWNLOADS, name_CONTAINS: $searchTerm }
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
      FavoriteDiscussions(where: { hasDownload: true }) {
        id
        title
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
      visibility
      itemCount
      itemOrder
      Discussions {
        id
        title
        body
        createdAt
        hasDownload
        hasSensitiveContent
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
          ServerRoles {
            showAdminTag
          }
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          CommentsAggregate {
            count
          }
        }
        Tags {
          text
        }
        Album {
          id
          Images {
            id
            url
            caption
          }
        }
      }
      Comments {
        id
        text
        createdAt
        CommentAuthor {
          ... on User {
            username
            displayName
            profilePicURL
            commentKarma
            discussionKarma
            createdAt
            ServerRoles {
              showAdminTag
            }
          }
        }
      }
      Downloads {
        id
        title
        body
        createdAt
        hasDownload
        hasSensitiveContent
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
          ServerRoles {
            showAdminTag
          }
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          CommentsAggregate {
            count
          }
        }
        Tags {
          text
        }
        Album {
          id
          Images {
            id
            url
            caption
          }
        }
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

// Check if a discussion is in collections
export const CHECK_DISCUSSION_IN_COLLECTIONS = gql`
  query CheckDiscussionInCollections(
    $username: String!
    $itemId: ID!
    $collectionType: CollectionType!
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          Discussions_SOME: { id: $itemId }
        }
      ) {
        id
        name
        collectionType
      }
    }
  }
`;

// Check if a comment is in collections
export const CHECK_COMMENT_IN_COLLECTIONS = gql`
  query CheckCommentInCollections(
    $username: String!
    $itemId: ID!
    $collectionType: CollectionType!
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          Comments_SOME: { id: $itemId }
        }
      ) {
        id
        name
        collectionType
      }
    }
  }
`;

// Check if a download is in collections
export const CHECK_DOWNLOAD_IN_COLLECTIONS = gql`
  query CheckDownloadInCollections(
    $username: String!
    $itemId: ID!
    $collectionType: CollectionType!
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          Downloads_SOME: { id: $itemId }
        }
      ) {
        id
        name
        collectionType
      }
    }
  }
`;

// Check if an image is in collections
export const CHECK_IMAGE_IN_COLLECTIONS = gql`
  query CheckImageInCollections(
    $username: String!
    $itemId: ID!
    $collectionType: CollectionType!
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          Images_SOME: { id: $itemId }
        }
      ) {
        id
        name
        collectionType
      }
    }
  }
`;

// Check if a channel is in collections (use String! for uniqueName)
export const CHECK_CHANNEL_IN_COLLECTIONS = gql`
  query CheckChannelInCollections(
    $username: String!
    $itemId: String!
    $collectionType: CollectionType!
  ) {
    users(where: { username: $username }) {
      username
      Collections(
        where: {
          collectionType: $collectionType
          Channels_SOME: { uniqueName: $itemId }
        }
      ) {
        id
        name
        collectionType
      }
    }
  }
`;

// Get all user collections (for library page)
export const GET_ALL_USER_COLLECTIONS = gql`
  query GetAllUserCollections($username: String!) {
    users(where: { username: $username }) {
      username
      Collections(options: { sort: [{ createdAt: DESC }] }) {
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
