import { gql } from '@apollo/client/core';

export const GET_USER_FAVORITE_COMMENTS = gql`
  query getUserFavoriteComments($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteComments(sort: [{ createdAt: DESC }]) {
        id
        text
        createdAt
        updatedAt
        CommentAuthor {
          ... on User {
            __typename
            username
            displayName
            profilePicURL
            commentKarma
            discussionKarma
            createdAt
          }
          ... on ModerationProfile {
            __typename
            displayName
          }
        }
        DiscussionChannel {
          id
          discussionId
          channelUniqueName
          Channel {
            uniqueName
            displayName
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
        }
        Event {
          id
          title
        }
      }
    }
  }
`;

export const GET_USER_FAVORITE_DISCUSSIONS_NO_DOWNLOADS = gql`
  query getUserFavoriteDiscussionsNoDownloads($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteDiscussions(
        where: {
          OR: [{ hasDownload: { eq: false } }, { hasDownload: { eq: null } }]
        }
        sort: { createdAt: DESC }
      ) {
        id
        title
        body
        createdAt
        updatedAt
        hasDownload
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          locked
          weightedVotesCount
          Channel {
            uniqueName
            displayName
          }
          CommentsConnection {
            aggregate {
              count {
                nodes
              }
            }
          }
        }
        Tags {
          text
        }
        Album {
          id
          Images {
            id
            url
            caption
          }
        }
        hasSensitiveContent
      }
    }
  }
`;

export const GET_USER_FAVORITE_DOWNLOADS = gql`
  query getUserFavoriteDownloads($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteDiscussions(
        where: { hasDownload: { eq: true } }
        sort: [{ createdAt: DESC }]
      ) {
        id
        title
        body
        createdAt
        updatedAt
        hasDownload
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          locked
          weightedVotesCount
          Channel {
            uniqueName
            displayName
          }
          CommentsConnection {
            aggregate {
              count {
                nodes
              }
            }
          }
        }
        Tags {
          text
        }
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
          }
        }
        hasSensitiveContent
      }
    }
  }
`;

export const GET_USER_FAVORITE_IMAGES = gql`
  query getUserFavoriteImages($username: String!) {
    users(where: { username: { eq: $username } }) {
      username
      FavoriteImages(sort: [{ createdAt: DESC }]) {
        id
        url
        alt
        caption
        copyright
        longDescription
        hasSensitiveContent
        hasSpoiler
        createdAt
        Uploader {
          username
          displayName
          profilePicURL
        }
      }
    }
  }
`;
