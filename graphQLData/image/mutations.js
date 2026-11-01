import { gql } from '@apollo/client/core';

export const ADD_IMAGE_TO_ALBUM = gql`
  mutation AddImageToAlbum($albumId: ID!, $imageId: ID!, $position: Int) {
    addImageToAlbum(albumId: $albumId, imageId: $imageId, position: $position)
  }
`;
