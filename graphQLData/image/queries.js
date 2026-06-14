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
      Album {
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
