import { gql } from '@apollo/client/core';

export const CREATE_SCRATCHPAD_ENTRY = gql`
  mutation createScratchpadEntry(
    $recipientUsername: String!
    $text: String!
    $sourceType: String!
    $sourceId: String!
    $sourceChannelUniqueName: String
  ) {
    createScratchpadEntry(
      recipientUsername: $recipientUsername
      text: $text
      sourceType: $sourceType
      sourceId: $sourceId
      sourceChannelUniqueName: $sourceChannelUniqueName
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
      superUpvotedByUsers {
        username
      }
    }
  }
`;

export const UPDATE_SCRATCHPAD_ENTRY_VISIBILITY = gql`
  mutation updateScratchpadEntryVisibility(
    $scratchpadEntryId: ID!
    $isPublic: Boolean!
  ) {
    updateScratchpadEntryVisibility(
      scratchpadEntryId: $scratchpadEntryId
      isPublic: $isPublic
    ) {
      id
      isPublic
      text
      sourceType
      sourceId
      sourceChannelUniqueName
      createdAt
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

export const DELETE_SCRATCHPAD_ENTRY = gql`
  mutation deleteScratchpadEntry($scratchpadEntryId: ID!) {
    deleteScratchpadEntry(scratchpadEntryId: $scratchpadEntryId)
  }
`;

export const UNDO_SUPER_UPVOTE = gql`
  mutation undoSuperUpvote($sourceType: String!, $sourceId: String!) {
    undoSuperUpvote(sourceType: $sourceType, sourceId: $sourceId) {
      success
      message
      sourceId
      sourceType
      superUpvotedByUsers {
        username
      }
    }
  }
`;
