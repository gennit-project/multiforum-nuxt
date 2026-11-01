import { gql } from '@apollo/client/core';
export const NEW_TAG = gql`
  fragment NewTag on Tag {
    text
  }
`;
