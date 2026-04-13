import { gql } from '@apollo/client/core';

export const GET_NOTIFICATIONS = gql`
  query getNotifications($username: String!, $options: NotificationOptions) {
    users(where: { username: $username }) {
      username
      profilePicURL
      Notifications(options: $options) {
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
  query getFeedbackNotifications($username: String!, $options: NotificationOptions) {
    users(where: { username: $username }) {
      username
      Notifications(
        where: { notificationType: "feedback" }
        options: $options
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
      totalNotificationsAggregate: NotificationsAggregate(
        where: { notificationType: "feedback" }
      ) {
        count
      }
    }
  }
`;

// Get all notifications except feedback
export const GET_GENERAL_NOTIFICATIONS = gql`
  query getGeneralNotifications($username: String!, $options: NotificationOptions) {
    users(where: { username: $username }) {
      username
      Notifications(
        where: { NOT: { notificationType: "feedback" } }
        options: $options
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
      totalNotificationsAggregate: NotificationsAggregate(
        where: { NOT: { notificationType: "feedback" } }
      ) {
        count
      }
    }
  }
`;
