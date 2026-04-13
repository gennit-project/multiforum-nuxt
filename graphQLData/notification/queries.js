import { gql } from '@apollo/client/core';

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
        notificationType
      }
      NotificationsAggregate(where: { read: false }) {
        count
      }
    }
  }
`;

// Get only feedback notifications
export const GET_FEEDBACK_NOTIFICATIONS = gql`
  query getFeedbackNotifications($username: String!) {
    users(where: { username: $username }) {
      username
      Notifications(
        where: { notificationType: "feedback" }
        options: { sort: { createdAt: DESC } }
      ) {
        id
        createdAt
        read
        text
        notificationType
      }
      NotificationsAggregate(
        where: { read: false, notificationType: "feedback" }
      ) {
        count
      }
    }
  }
`;

// Get all notifications except feedback
export const GET_GENERAL_NOTIFICATIONS = gql`
  query getGeneralNotifications($username: String!) {
    users(where: { username: $username }) {
      username
      Notifications(
        where: { NOT: { notificationType: "feedback" } }
        options: { sort: { createdAt: DESC } }
      ) {
        id
        createdAt
        read
        text
        notificationType
      }
      NotificationsAggregate(
        where: { read: false, NOT: { notificationType: "feedback" } }
      ) {
        count
      }
    }
  }
`;
