import { gql } from '@apollo/client/core';

export const CREATE_USER = gql`
  mutation createUser($username: String!) {
    createUsers(input: [{ username: $username }]) {
      users {
        username
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation updateUser($where: UserWhere, $update: UserUpdateInput) {
    updateUsers(where: $where, update: $update) {
      users {
        username
        displayName
        bio
        profilePicURL
        notifyOnReplyToCommentByDefault
        notifyOnReplyToDiscussionByDefault
        notifyOnReplyToEventByDefault
        notifyWhenTagged
        notifyOnFeedback
        notificationBundleInterval
        notificationBundleEnabled
        notificationBundleContent
        enableSensitiveContentByDefault
      }
    }
  }
`;

export const CREATE_MOD_PROFILE = gql`
  mutation createModProfile($username: String!, $displayName: String!) {
    updateUsers(
      where: { username: $username }
      create: { ModerationProfile: { node: { displayName: $displayName } } }
    ) {
      users {
        username
        ModerationProfile {
          displayName
        }
      }
    }
  }
`;

export const MARK_NOTIFICATIONS_AS_READ = gql`
  mutation markNotificationsAsRead($username: String!) {
    updateUsers(
      where: { username: $username }
      update: {
        Notifications: {
          where: { node: { read: false } }
          update: { node: { read: true } }
        }
      }
    ) {
      users {
        username
        Notifications {
          text
          read
          createdAt
        }
      }
    }
  }
`;

export const ADD_FAVORITE_CHANNEL = gql`
  mutation addFavoriteChannel($channel: String!, $username: String!) {
    updateUsers(
      where: { username: $username }
      update: {
        FavoriteChannels: {
          connect: [
            {
              where: {
                node: {
                  uniqueName: $channel
                }
              }
            }
          ]
        }
      }
    ) {
      users {
        username
        FavoriteChannels {
          uniqueName
        }
      }
    }
  }
`;

export const REMOVE_FAVORITE_CHANNEL = gql`
  mutation removeFavoriteChannel($channel: String!, $username: String!) {
    updateUsers(
      where: { username: $username }
      update: {
        FavoriteChannels: {
          disconnect: [
            {
              where: {
                node: {
                  uniqueName: $channel
                }
              }
            }
          ]
        }
      }
    ) {
      users {
        username
        FavoriteChannels {
          uniqueName
        }
      }
    }
  }
`;
