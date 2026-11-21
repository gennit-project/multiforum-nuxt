import { gql } from '@apollo/client/core';

export const GET_IMAGE_DETAILS = gql`
  query GetImageDetails($imageId: ID!) {
    images(where: { id: { eq: $imageId } }) {
      id
      imageNumber
      archived
      url
      alt
      caption
      copyright
      longDescription
      hasSensitiveContent
      hasSpoiler
      createdAt
      scanCheckedAt
      Uploader {
        username
        displayName
        profilePicURL
      }
    }
  }
`;

export const GET_ALBUM_DETAILS = gql`
  query GetAlbumDetails($albumId: ID!) {
    albums(where: { id: { eq: $albumId } }) {
      id
      albumNumber
      ownerUsername
      imageOrder
      Owner {
        username
        displayName
      }
      Images(
        where: { NOT: { archived: { eq: true }, permanentlyRemoved: { eq: true } } }
      ) {
        id
        imageNumber
        url
        alt
        caption
        createdAt
        Uploader {
          username
          displayName
        }
      }
      Discussions {
        id
        title
        createdAt
        Author {
          username
          displayName
        }
        DiscussionChannels {
          id
          channelUniqueName
          discussionNumber
        }
      }
    }
  }
`;

export const GET_USER_ALBUMS = gql`
  query GetUserAlbums($where: AlbumWhere) {
    albums(where: $where) {
      id
      albumNumber
      ownerUsername
      imageOrder
      Owner {
        username
        displayName
      }
      Images(
        where: { NOT: { archived: { eq: true }, permanentlyRemoved: { eq: true } } }
        limit: 4
        sort: { createdAt: DESC }
      ) {
        id
        imageNumber
        url
        alt
        caption
        createdAt
        Uploader {
          username
        }
      }
      ImagesConnection(
        where: {
          node: { NOT: { archived: { eq: true }, permanentlyRemoved: { eq: true } } }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      Discussions(sort: { createdAt: DESC }) {
        id
        title
        createdAt
        DiscussionChannels {
          id
          channelUniqueName
          discussionNumber
        }
      }
    }
  }
`;

export const GET_USER_ALBUMS_FOR_IMAGE_SAVE = gql`
  query GetUserAlbumsForImageSave($username: String!, $imageId: ID!) {
    albums(where: { Owner: { username: { eq: $username } } }) {
      id
      albumNumber
      ownerUsername
      Owner {
        username
        displayName
      }
      matchingImages: Images(where: { id: { eq: $imageId } }) {
        id
      }
      ImagesConnection(
        where: {
          node: { NOT: { archived: { eq: true }, permanentlyRemoved: { eq: true } } }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      Discussions(sort: { createdAt: DESC }) {
        id
        title
      }
    }
  }
`;

export const GET_USER_IMAGES = gql`
  query GetUserImages(
    $username: String!
    $loggedInUsername: String
    $offset: Int!
    $limit: Int!
    $where: ImageWhere
  ) {
    users(where: { username: { eq: $username } }) {
      username
      displayName
      Images(
        where: $where
        limit: $limit
        offset: $offset
        sort: { createdAt: DESC }
      ) {
        id
        imageNumber
        url
        alt
        caption
        copyright
        longDescription
        hasSensitiveContent
        hasSpoiler
        createdAt
        isFavorited(username: $loggedInUsername)
        Uploader {
          username
          displayName
        }
      }
      ImagesConnection(where: { node: $where }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

// Reusable-image picker queries. Each source (uploads, favorites, a chosen
// collection) is fetched separately and paginated with offset/limit so the
// album editor's "Reuse an image" picker can page through large libraries.
// isFavorited is intentionally omitted here: the picker never displays favorite
// status and the field is resolver-backed, so selecting it adds cost for nothing.

export const GET_REUSABLE_USER_IMAGES = gql`
  query GetReusableUserImages(
    $username: String!
    $where: ImageWhere
    $offset: Int!
    $limit: Int!
  ) {
    users(where: { username: { eq: $username } }) {
      username
      Images(
        where: $where
        limit: $limit
        offset: $offset
        sort: { createdAt: DESC }
      ) {
        id
        imageNumber
        url
        alt
        caption
        copyright
        createdAt
        Uploader {
          username
          displayName
        }
      }
      ImagesConnection(where: { node: $where }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_REUSABLE_FAVORITE_IMAGES = gql`
  query GetReusableFavoriteImages(
    $username: String!
    $where: ImageWhere
    $offset: Int!
    $limit: Int!
  ) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteImages(
        where: $where
        limit: $limit
        offset: $offset
        sort: { createdAt: DESC }
      ) {
        id
        imageNumber
        url
        alt
        caption
        copyright
        createdAt
        Uploader {
          username
          displayName
        }
      }
      FavoriteImagesConnection(where: { node: $where }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_REUSABLE_IMAGE_COLLECTIONS = gql`
  query GetReusableImageCollections($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      Collections(
        where: { collectionType: { eq: IMAGES } }
        sort: [{ updatedAt: DESC }]
      ) {
        id
        collectionNumber
        ownerUsername
        name
        itemCount
      }
    }
  }
`;

export const GET_REUSABLE_COLLECTION_IMAGES = gql`
  query GetReusableCollectionImages(
    $collectionId: ID!
    $where: ImageWhere
    $offset: Int!
    $limit: Int!
  ) {
    collections(where: { id: { eq: $collectionId } }) {
      id
      collectionNumber
      ownerUsername
      name
      Images(
        where: $where
        limit: $limit
        offset: $offset
        sort: { createdAt: DESC }
      ) {
        id
        imageNumber
        url
        alt
        caption
        copyright
        createdAt
        Uploader {
          username
          displayName
        }
      }
      ImagesConnection(where: { node: $where }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

// Resolves a route's per-user image number to the global image id.
export const GET_IMAGE_ID_BY_NUMBER = gql`
  query getImageIdByNumber($username: String!, $imageNumber: Int!) {
    getImageIdByNumber(username: $username, imageNumber: $imageNumber)
  }
`;

// Resolves a route's per-user album number to the global album id.
export const GET_ALBUM_ID_BY_NUMBER = gql`
  query getAlbumIdByNumber($username: String!, $albumNumber: Int!) {
    getAlbumIdByNumber(username: $username, albumNumber: $albumNumber)
  }
`;
