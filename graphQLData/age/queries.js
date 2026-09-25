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

export const GET_MY_AGE_PROFILE = gql`
  query getMyAgeProfile {
    getMyAgeProfile {
      birthday
      meetsAccountMinimumAge
      mayAccessSensitiveContent
    }
  }
`;
