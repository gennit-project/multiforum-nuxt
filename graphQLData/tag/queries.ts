import { gql } from '@apollo/client/core';

export const GET_TAGS = gql`
  query getTags($where: TagWhere) {
    tags(where: $where, limit: 10) {
      text
    }
  }
`;
