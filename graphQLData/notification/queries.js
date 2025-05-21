import { gql } from "@apollo/client/core";

export const GET_NOTIFICATIONS = gql`
  query getNotifications($username: String!) {
    users(where: { username: $username }) {
      username
      profilePicURL
      Notifications(options: { sort: { createdAt: DESC } }) {
        id
        createdAt
        read
        text
      }
      NotificationsAggregate(where: { read: false }) {
        count
      }
    }
  }
`;
