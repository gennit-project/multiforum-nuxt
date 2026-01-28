import { gql } from '@apollo/client/core';

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

export const SEND_BUG_REPORT = gql`
  mutation sendBugReport(
    $contactEmail: String!
    $username: String
    $text: String!
    $subject: String!
  ) {
    sendBugReport(
      contactEmail: $contactEmail
      username: $username
      text: $text
      subject: $subject
    )
  }
`;
