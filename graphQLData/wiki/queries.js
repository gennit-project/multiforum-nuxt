import { gql } from '@apollo/client/core';

export const GET_SITE_WIDE_WIKI_LIST = gql`
  query getSiteWideWikiList(
    $searchInput: String!
    $selectedChannels: [String!]
    $options: WikiListOptions
  ) {
    getSiteWideWikiList(
      searchInput: $searchInput
      selectedChannels: $selectedChannels
      options: $options
    ) {
      aggregateWikiPageCount
      featuredWikiPages {
        id
        title
        body
        slug
        channelUniqueName
        createdAt
        updatedAt
        VersionAuthor {
          username
          displayName
          profilePicURL
        }
      }
      wikiPages {
        id
        title
        body
        slug
        channelUniqueName
        createdAt
        updatedAt
        VersionAuthor {
          username
          displayName
          profilePicURL
        }
      }
    }
  }
`;

export const GET_WIKI_PAGES_BY_IDS = gql`
  query getWikiPagesByIds($ids: [ID!]!) {
    wikiPages(where: { id_IN: $ids }) {
      id
      title
      body
      slug
      channelUniqueName
      createdAt
      updatedAt
      VersionAuthor {
        username
        displayName
        profilePicURL
      }
    }
  }
`;
