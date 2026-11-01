import { gql } from '@apollo/client/core';

export const WRITE_WIKI_PAGE = gql`
  mutation writeWikiPage($input: WriteWikiPageInput!) {
    writeWikiPage(input: $input) {
      id
      slug
      channelUniqueName
      title
      body
      editReason
      createdAt
      updatedAt
      locked
      OriginalAuthor {
        username
      }
      VersionAuthor {
        username
      }
      PastVersions {
        id
        body
        editReason
        createdAt
        Author {
          username
        }
      }
    }
  }
`;
