import { gql } from '@apollo/client/core';

export const GET_UNIFIED_LIBRARY_FAVORITES = gql`
  query GetUnifiedLibraryFavorites($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteDiscussions(options: { sort: { createdAt: DESC }, limit: 50 }) {
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
      FavoriteImages(options: { sort: { createdAt: DESC }, limit: 50 }) {
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
        Album {
          id
          Discussions(options: { limit: 1 }) {
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
      FavoriteComments(options: { sort: { createdAt: DESC }, limit: 50 }) {
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
      FavoriteChannels(options: { sort: { createdAt: DESC }, limit: 50 }) {
        uniqueName
        displayName
        description
        channelIconURL
        createdAt
        Admins(options: { limit: 1 }) {
          username
          displayName
          profilePicURL
        }
      }
    }
  }
`;
