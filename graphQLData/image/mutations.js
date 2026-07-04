import { gql } from '@apollo/client/core';

export const ADD_IMAGE_TO_ALBUM = gql`
  mutation AddImageToAlbum($albumId: ID!, $imageId: ID!, $position: Int) {
    addImageToAlbum(albumId: $albumId, imageId: $imageId, position: $position)
  }
`;

export const REMOVE_IMAGE_FROM_ALBUM = gql`
  mutation RemoveImageFromAlbum($albumId: ID!, $imageId: ID!) {
    removeImageFromAlbum(albumId: $albumId, imageId: $imageId)
  }
`;
