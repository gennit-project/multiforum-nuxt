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
        DiscussionChannel {
          id
          channelUniqueName
          Discussion {
            id
            title
          }
          Channel {
            uniqueName
            displayName
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
        Uploader {
          username
        }
      }
      Channels {
        displayName
        uniqueName
        createdAt
      }
    }
  }
`;

export const GET_PUBLIC_COLLECTIONS_FOR_DOWNLOAD = gql`
  query GetPublicCollectionsForDownload($downloadId: ID!) {
    publicCollectionsContaining(itemId: $downloadId, itemType: DOWNLOAD) {
      id
      name
      description
      visibility
      collectionType
      itemCount
      createdAt
      CreatedBy {
        username
        displayName
        profilePicURL
      }
      Downloads(options: { limit: 5 }) {
        id
        title
        createdAt
        hasSensitiveContent
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
          }
        }
        DiscussionChannels {
          id
          channelUniqueName
          CommentsAggregate {
            count
          }
          Channel {
            uniqueName
            displayName
          }
        }
        Tags {
          text
        }
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
      }
    }
  }
`;

export const GET_PUBLIC_COLLECTION_BY_ID = gql`
  query GetPublicCollectionById(
    $collectionId: ID!
    $downloadLimit: Int = 20
    $downloadOffset: Int = 0
  ) {
    collections(where: { id: $collectionId, visibility: PUBLIC }) {
      id
      name
      description
      visibility
      collectionType
      itemCount
      createdAt
      CreatedBy {
        username
        displayName
        profilePicURL
      }
      DownloadsAggregate {
        count
      }
      Downloads(
        options: {
          limit: $downloadLimit
          offset: $downloadOffset
          sort: [{ createdAt: DESC }]
        }
      ) {
        id
        title
        createdAt
        hasSensitiveContent
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
          }
        }
        DiscussionChannels {
          id
          channelUniqueName
        }
        Tags {
          text
        }
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

// Get user's channel collections with the channels in each collection
export const GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS = gql`
  query GetUserChannelCollectionsWithChannels($username: String!) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: CHANNELS }
        options: { sort: [{ createdAt: DESC }] }
      ) {
        id
        name
        itemCount
        Channels {
          uniqueName
          displayName
          channelIconURL
        }
      }
    }
  }
`;
