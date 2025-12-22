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
