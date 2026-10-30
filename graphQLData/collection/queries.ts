import { gql } from '@apollo/client/core';

export const GET_USER_COLLECTIONS_DISCUSSIONS = gql`
  query GetUserCollectionsDiscussions($username: String!, $searchTerm: String) {
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: DISCUSSIONS }, name_CONTAINS: $searchTerm }
        sort: [{ createdAt: DESC }]
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: COMMENTS }, name_CONTAINS: $searchTerm }
        sort: [{ createdAt: DESC }]
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: IMAGES }, name_CONTAINS: $searchTerm }
        sort: [{ createdAt: DESC }]
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: CHANNELS }, name_CONTAINS: $searchTerm }
        sort: [{ createdAt: DESC }]
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: DOWNLOADS }, name_CONTAINS: $searchTerm }
        sort: [{ createdAt: DESC }]
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
      FavoriteDiscussions(where: { hasDownload: { eq: true } }) {
        id
        title
      }
    }
  }
`;

export const GET_COLLECTION_ITEMS = gql`
  query GetCollectionItems($collectionId: ID!, $loggedInUsername: String) {
    collections(where: { id: { eq: $collectionId } }) {
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
        isFavorited(username: $loggedInUsername)
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          CommentsConnection {
            aggregate { count { nodes } }
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
        isFavorited(username: $loggedInUsername)
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          CommentsConnection {
            aggregate { count { nodes } }
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
        description
        channelIconURL
        createdAt
        Tags {
          text
        }
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
      Downloads(limit: 5) {
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
          CommentsConnection {
            aggregate { count { nodes } }
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
    collections(where: { id: { eq: $collectionId }, visibility: { eq: PUBLIC } }) {
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
      DownloadsConnection {
        aggregate { count { nodes } }
      }
      Downloads(
        limit: $downloadLimit
        offset: $downloadOffset
        sort: [{ createdAt: DESC }]
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: {
          collectionType: { eq: $collectionType }
          Discussions_SOME: { id: { eq: $itemId } }
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: {
          collectionType: { eq: $collectionType }
          Comments_SOME: { id: { eq: $itemId } }
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: {
          collectionType: { eq: $collectionType }
          Downloads_SOME: { id: { eq: $itemId } }
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: $collectionType }, Images_SOME: { id: { eq: $itemId } } }
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: {
          collectionType: { eq: $collectionType }
          Channels_SOME: { uniqueName: { eq: $itemId } }
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(sort: [{ createdAt: DESC }]) {
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
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: CHANNELS } }
        sort: [{ createdAt: DESC }]
      ) {
        id
        name
        itemCount
        Channels {
          uniqueName
          displayName
          channelIconURL
          eventsEnabled
        }
      }
    }
  }
`;
