import { gql } from '@apollo/client/core';

export const GET_EMAIL = gql`
  query getEmail($emailAddress: String!) {
    emails(where: {
        address: $emailAddress
    }) {
      address
      User {
        username
        profilePicURL
        ModerationProfile {
          displayName
        }
        NotificationsAggregate (
          where: {
            read: false
          }
        ) {
          count
        }
      }
    }
  }
`;