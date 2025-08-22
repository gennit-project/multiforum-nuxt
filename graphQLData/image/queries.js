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
      }
    }
  }
`;

export const GET_USER_IMAGES = gql`
  query GetUserImages($username: String!, $offset: Int!, $limit: Int!) {
    users(where: { username: $username }) {
      username
      displayName
      Images(
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
    }
  }
`;
