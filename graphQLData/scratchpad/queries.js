import { gql } from '@apollo/client/core';

// Get public scratchpad entries for a user profile (visible to everyone)
export const GET_PUBLIC_SCRATCHPAD_ENTRIES = gql`
  query getPublicScratchpadEntries($username: String!) {
    scratchpadEntries(
      where: { Recipient: { username: $username }, isPublic: true }
      options: { sort: [{ createdAt: DESC }] }
    ) {
      id
      createdAt
      text
      isPublic
      sourceType
      sourceId
      sourceChannelUniqueName
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
      where: { Recipient: { username: $username }, isPublic: false }
      options: { sort: [{ createdAt: DESC }] }
    ) {
      id
      createdAt
      text
      isPublic
      sourceType
      sourceId
      sourceChannelUniqueName
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

// Get all scratchpad entries for profile owner (both public and pending)
export const GET_ALL_SCRATCHPAD_ENTRIES = gql`
  query getAllScratchpadEntries($username: String!) {
    scratchpadEntries(
      where: { Recipient: { username: $username } }
      options: { sort: [{ createdAt: DESC }] }
    ) {
      id
      createdAt
      text
      isPublic
      sourceType
      sourceId
      sourceChannelUniqueName
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

// Count of super upvotes received by a user (for profile sidebar)
export const GET_SUPER_UPVOTE_COUNT = gql`
  query getSuperUpvoteCount($username: String!) {
    scratchpadEntriesAggregate(where: { Recipient: { username: $username } }) {
      count
    }
  }
`;
