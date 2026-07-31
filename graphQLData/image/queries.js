import { gql } from '@apollo/client/core';

export const GET_IMAGE_DETAILS = gql`
  query GetImageDetails($imageId: ID!) {
    images(where: { id: $imageId }) {
      id
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
      Albums {
        id
        imageOrder
        Owner {
          username
          displayName
        }
        Images(where: { archived_NOT: true, permanentlyRemoved_NOT: true }) {
          id
          url
          alt
          caption
          Uploader {
            username
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
          }
        }
      }
    }
  }
`;

export const GET_IMAGE_ALBUM_USAGE = gql`
  query GetImageAlbumUsage($imageId: ID!) {
    getImageAlbumUsage(imageId: $imageId) {
      imageId
      uploaderUsername
      uploaderOwnedAlbums {
        id
        imageOrder
        Owner {
          username
          displayName
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
          }
        }
      }
      otherAlbums {
        id
        imageOrder
        Owner {
          username
          displayName
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
          }
        }
      }
    }
  }
`;

export const GET_ALBUM_DETAILS = gql`
  query GetAlbumDetails($albumId: ID!) {
    albums(where: { id: $albumId }) {
      id
      imageOrder
      Owner {
        username
        displayName
      }
      Images(where: { archived_NOT: true, permanentlyRemoved_NOT: true }) {
        id
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
        }
      }
    }
  }
`;

export const GET_USER_ALBUMS = gql`
  query GetUserAlbums($where: AlbumWhere) {
    albums(where: $where) {
      id
      imageOrder
      Owner {
        username
        displayName
      }
      Images(
        where: { archived_NOT: true, permanentlyRemoved_NOT: true }
        options: { limit: 4, sort: { createdAt: DESC } }
      ) {
        id
        url
        alt
        caption
        createdAt
        Uploader {
          username
        }
      }
      ImagesAggregate(where: { archived_NOT: true, permanentlyRemoved_NOT: true }) {
        count
      }
      Discussions(options: { sort: { createdAt: DESC } }) {
        id
        title
        createdAt
        DiscussionChannels {
          id
          channelUniqueName
        }
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
    users(where: { username: $username }) {
      username
      displayName
      Images(
        where: $where
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
      ) {
        id
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
      ImagesAggregate(where: $where) {
        count
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
    users(where: { username: $username }) {
      username
      Images(
        where: $where
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
      ) {
        id
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
      ImagesAggregate(where: $where) {
        count
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
    users(where: { username: $username }) {
      username
      FavoriteImages(
        where: $where
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
      ) {
        id
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
      FavoriteImagesAggregate(where: $where) {
        count
      }
    }
  }
`;

export const GET_REUSABLE_IMAGE_COLLECTIONS = gql`
  query GetReusableImageCollections($username: String!) {
    users(where: { username: $username }) {
      username
      Collections(
        where: { collectionType: IMAGES }
        options: { sort: [{ updatedAt: DESC }] }
      ) {
        id
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
    collections(where: { id: $collectionId }) {
      id
      name
      Images(
        where: $where
        options: { limit: $limit, offset: $offset, sort: { createdAt: DESC } }
      ) {
        id
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
      ImagesAggregate(where: $where) {
        count
      }
    }
  }
`;
