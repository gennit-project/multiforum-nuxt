import { gql } from '@apollo/client/core';

// Get public scratchpad entries for a user profile (visible to everyone)
export const GET_PUBLIC_SCRATCHPAD_ENTRIES = gql`
  query getPublicScratchpadEntries(
    $username: String!
    $limit: Int
    $offset: Int
  ) {
    scratchpadEntriesConnection(
      where: { Recipient: { username: { eq: $username } }, isPublic: { eq: true } }
    ) {
      aggregate {
        count {
          nodes
        }
      }
    }
    scratchpadEntries(
      where: { Recipient: { username: { eq: $username } }, isPublic: { eq: true } }
      sort: [{ createdAt: DESC }]
      limit: $limit
      offset: $offset
    ) {
      id
      createdAt
      text
      isPublic
      sourceType
      sourceId
      sourceChannelUniqueName
      discussionId
      Author {
        username
        displayName
        profilePicURL
      }
      Recipient {
        username
      }
    }
  }
`;

// Get pending (private) scratchpad entries for profile owner only
export const GET_PENDING_SCRATCHPAD_ENTRIES = gql`
  query getPendingScratchpadEntries($username: String!) {
    scratchpadEntries(
      where: { Recipient: { username: { eq: $username } }, isPublic: { eq: false } }
      sort: [{ createdAt: DESC }]
    ) {
      id
      createdAt
      text
      isPublic
      sourceType
      sourceId
      sourceChannelUniqueName
      discussionId
      Author {
        username
        displayName
        profilePicURL
      }
      Recipient {
        username
      }
    }
  }
`;
