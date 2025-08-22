import { gql } from '@apollo/client/core';

const CREATE_TAG = gql`
  mutation createTag($input: [TagCreateInput!]!) {
    createTags(input: $input) {
      tags {
        text
      }
    }
  }
`;

export { CREATE_TAG };
