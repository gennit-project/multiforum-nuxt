import { gql } from '@apollo/client/core';

export const GET_NOTIFICATIONS = gql`
  query getNotifications(
    $username: String!
    $sort: [NotificationSort!]
    $limit: Int
    $offset: Int
  ) {
    users(where: { username: { eq: $username } }) {
      username
      profilePicURL
      Notifications(sort: $sort, limit: $limit, offset: $offset) {
        id
        createdAt
        read
        text
        notificationType
        link
        ScratchpadEntry {
          id
          isPublic
        }
      }
      NotificationsAggregate: NotificationsConnection(
        where: { node: { read: { eq: false } } }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

// Get only feedback notifications
export const GET_FEEDBACK_NOTIFICATIONS = gql`
  query getFeedbackNotifications(
    $username: String!
    $sort: [NotificationSort!]
    $limit: Int
    $offset: Int
  ) {
    users(where: { username: { eq: $username } }) {
      username
      Notifications(
        where: { notificationType: { eq: "feedback" } }
        sort: $sort
        limit: $limit
        offset: $offset
      ) {
        id
        createdAt
        read
        text
        notificationType
        link
      }
      NotificationsAggregate: NotificationsConnection(
        where: { node: { read: { eq: false }, notificationType: { eq: "feedback" } } }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      totalNotificationsAggregate: NotificationsConnection(
        where: { node: { notificationType: { eq: "feedback" } } }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

// Get all notifications except feedback
export const GET_GENERAL_NOTIFICATIONS = gql`
  query getGeneralNotifications(
    $username: String!
    $sort: [NotificationSort!]
    $limit: Int
    $offset: Int
  ) {
    users(where: { username: { eq: $username } }) {
      username
      Notifications(
        where: {
          OR: [
            { notificationType: { eq: null } }
            { NOT: { notificationType: { eq: "feedback" } } }
          ]
        }
        sort: $sort
        limit: $limit
        offset: $offset
      ) {
        id
        createdAt
        read
        text
        notificationType
        link
        ScratchpadEntry {
          id
          isPublic
        }
      }
      NotificationsAggregate: NotificationsConnection(
        where: {
          node: {
            read: { eq: false }
            OR: [
              { notificationType: { eq: null } }
              { NOT: { notificationType: { eq: "feedback" } } }
            ]
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
      totalNotificationsAggregate: NotificationsConnection(
        where: {
          node: {
            OR: [
              { notificationType: { eq: null } }
              { NOT: { notificationType: { eq: "feedback" } } }
            ]
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;
