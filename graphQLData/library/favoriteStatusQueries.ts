import { gql } from '@apollo/client/core';

export const AddImageToFavoritesQuery = gql`
  query getUserFavoriteImage($username: String!, $imageId: ID!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteImages(where: { id: { eq: $imageId } }) {
        id
        url
      }
    }
  }
`;

export const AddToChannelFavoritesQuery = gql`
  query getUserFavorites($username: String!, $channelUniqueName: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteChannels(where: { uniqueName: { eq: $channelUniqueName } }) {
        uniqueName
      }
    }
  }
`;

export const AddToCommentFavoritesQuery = gql`
  query getUserFavoriteComment($commentId: ID!) {
    getUserFavoriteComment(commentId: $commentId)
  }
`;

export const AddToDiscussionFavoritesQuery = gql`
  query getUserFavoriteDiscussion($username: String!, $discussionId: ID!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteDiscussions(where: { id: { eq: $discussionId } }) {
        id
        title
      }
    }
  }
`;

export const AddToImageFavoritesQuery = gql`
  query getUserFavoriteImage($username: String!, $imageId: ID!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteImages(where: { id: { eq: $imageId } }) {
        id
        url
      }
    }
  }
`;
