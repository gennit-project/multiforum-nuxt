import { gql } from '@apollo/client/core';

export const SET_MY_BIRTHDAY = gql`
  mutation setMyBirthday($birthday: String!) {
    setMyBirthday(birthday: $birthday) {
      birthday
      meetsAccountMinimumAge
      mayAccessSensitiveContent
    }
  }
`;
