import { gql } from '@apollo/client/core';

export const GET_EMAIL = gql`
  query getEmail($emailAddress: String!) {
    emails(where: {
        address: $emailAddress
    }) {
      address
      User {
        username
        ModerationProfile {
          displayName
        }
      }
    }
  }
`;