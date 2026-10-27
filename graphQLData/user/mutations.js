import { gql } from '@apollo/client/core';

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
        notifyOnSubscribedIssueUpdates
        notifyOnFeedback
        notificationBundleInterval
        notificationBundleEnabled
        notificationBundleContent
        enableSensitiveContentByDefault
      }
    }
  }
`;

export const PERMANENTLY_DELETE_PROFILE_IMAGE = gql`
  mutation permanentlyDeleteProfileImage($username: String!, $imageUrl: String!) {
    permanentlyDeleteProfileImage(username: $username, imageUrl: $imageUrl) {
      username
      profilePicURL
    }
  }
`;

export const MARK_NOTIFICATIONS_AS_READ = gql`
  mutation markNotificationsAsRead($username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        Notifications: [
          {
            update: {
              where: { node: { read: { eq: false } } }
              node: { read: { set: true } }
            }
          }
        ]
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

// Mark a single notification as read (e.g. when ignoring a super-upvote note).
// Goes through updateUsers because direct updateNotifications is denied server-side.
export const MARK_NOTIFICATION_AS_READ = gql`
  mutation markNotificationAsRead($username: String!, $notificationId: ID!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        Notifications: [
          {
            update: {
              where: { node: { id: { eq: $notificationId } } }
              node: { read: { set: true } }
            }
          }
        ]
      }
    ) {
      users {
        username
        Notifications(where: { id: { eq: $notificationId } }) {
          id
          read
        }
      }
    }
  }
`;

export const ADD_FAVORITE_CHANNEL = gql`
  mutation addFavoriteChannel($channel: String!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteChannels: {
          connect: [{ where: { node: { uniqueName: { eq: $channel } } } }]
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
      where: { username: { eq: $username } }
      update: {
        FavoriteChannels: {
          disconnect: [{ where: { node: { uniqueName: { eq: $channel } } } }]
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

export const ADD_FAVORITE_DISCUSSION = gql`
  mutation addFavoriteDiscussion($discussionId: ID!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteDiscussions: {
          connect: [{ where: { node: { id: { eq: $discussionId } } } }]
        }
      }
    ) {
      users {
        username
        FavoriteDiscussions {
          id
          title
        }
      }
    }
  }
`;

export const REMOVE_FAVORITE_DISCUSSION = gql`
  mutation removeFavoriteDiscussion($discussionId: ID!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteDiscussions: {
          disconnect: [{ where: { node: { id: { eq: $discussionId } } } }]
        }
      }
    ) {
      users {
        username
        FavoriteDiscussions {
          id
          title
        }
      }
    }
  }
`;

export const ADD_FAVORITE_COMMENT = gql`
  mutation addFavoriteComment($commentId: ID!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteComments: {
          connect: [{ where: { node: { id: { eq: $commentId } } } }]
        }
      }
    ) {
      users {
        username
        FavoriteComments {
          id
        }
      }
    }
  }
`;

export const REMOVE_FAVORITE_COMMENT = gql`
  mutation removeFavoriteComment($commentId: ID!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteComments: {
          disconnect: [{ where: { node: { id: { eq: $commentId } } } }]
        }
      }
    ) {
      users {
        username
        FavoriteComments {
          id
        }
      }
    }
  }
`;

export const ADD_FAVORITE_IMAGE = gql`
  mutation addFavoriteImage($imageId: ID!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteImages: {
          connect: [{ where: { node: { id: { eq: $imageId } } } }]
        }
      }
    ) {
      users {
        username
        FavoriteImages {
          id
          url
        }
      }
    }
  }
`;

export const REMOVE_FAVORITE_IMAGE = gql`
  mutation removeFavoriteImage($imageId: ID!, $username: String!) {
    updateUsers(
      where: { username: { eq: $username } }
      update: {
        FavoriteImages: {
          disconnect: [{ where: { node: { id: { eq: $imageId } } } }]
        }
      }
    ) {
      users {
        username
        FavoriteImages {
          id
          url
        }
      }
    }
  }
`;
