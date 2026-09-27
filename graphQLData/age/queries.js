import { gql } from '@apollo/client/core';

export const GET_AGE_POLICY = gql`
  query getAgePolicy {
    getAgePolicy {
      accountAgeGateEnabled
      minimumAccountAge
      sensitiveContentAgeGateEnabled
      minimumSensitiveContentAge
    }
  }
`;

export const GET_DISCUSSION_AGE_GATE_CHECK = gql`
  query getDiscussionAgeGateCheck($discussionId: ID!) {
    getDiscussionAgeGateCheck(discussionId: $discussionId) {
      requiresAgeCheck
      status
      minimumAge
    }
  }
`;
