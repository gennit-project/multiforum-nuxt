import { gql } from '@apollo/client/core';

export const GET_UNIFIED_LIBRARY_FAVORITES = gql`
  query GetUnifiedLibraryFavorites($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteDiscussions(sort: [{ createdAt: DESC }], limit: 50) {
        id
        title
        body
        createdAt
        hasDownload
        Author {
          username
          displayName
          profilePicURL
        }
        DiscussionChannels {
          channelUniqueName
          Channel {
            uniqueName
            displayName
            channelIconURL
          }
        }
        Album {
          id
          imageOrder
          Images {
            id
            url
          }
        }
      }
      FavoriteImages(sort: [{ createdAt: DESC }], limit: 50) {
        id
        url
        alt
        caption
        createdAt
        Uploader {
          username
          displayName
          profilePicURL
        }
        Albums(limit: 1) {
          id
          Discussions(limit: 1) {
            id
            DiscussionChannels {
              channelUniqueName
              Channel {
                uniqueName
                displayName
                channelIconURL
              }
            }
          }
        }
      }
      FavoriteComments(sort: [{ createdAt: DESC }], limit: 50) {
        id
        text
        createdAt
        CommentAuthor {
          ... on User {
            username
            displayName
            profilePicURL
          }
          ... on ModerationProfile {
            displayName
          }
        }
        DiscussionChannel {
          discussionId
          channelUniqueName
          Channel {
            uniqueName
            displayName
            channelIconURL
          }
          Discussion {
            id
            title
            hasDownload
          }
        }
        Channel {
          uniqueName
          displayName
          channelIconURL
        }
      }
      FavoriteChannels(sort: [{ createdAt: DESC }], limit: 50) {
        uniqueName
        displayName
        description
        channelIconURL
        createdAt
        Admins(limit: 1) {
          username
          displayName
          profilePicURL
        }
      }
    }
  }
`;
