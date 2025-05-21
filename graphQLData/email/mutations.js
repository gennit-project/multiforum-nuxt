import { gql } from "@apollo/client/core";

export const GET_EMAIL = gql`
  query getEmail($emailAddress: String!) {
    emails(where: { address: $emailAddress }) {
      address
      User {
        username
        NotificationsAggregate(where: { read: false }) {
          count
        }
      }
    }
  }
`;

export const CREATE_EMAIL_AND_USER = gql`
  mutation createEmailAndUser($emailAddress: String!, $username: String!) {
    createEmailAndUser(emailAddress: $emailAddress, username: $username) {
      username
      Email {
        address
      }
      ModerationProfile {
        displayName
      }
    }
  }
`;
