import { gql } from "@apollo/client/core";

export const CREATE_USER = gql`
  mutation createUser($username: String!) {
    createUsers(input: [{ username: $username }]) {
      users {
        username
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation updateUser(
    $where: UserWhere
    $update: UserUpdateInput
  ) {
    updateUsers(where: $where, update: $update) {
      users {
        username
        displayName 
        bio 
        profilePicURL
      }
    }
  }
`;


export const CREATE_MOD_PROFILE = gql`
  mutation createModProfile($username: String!, $displayName: String!) {
    updateUsers(
      where: { username: $username }
      create: { ModerationProfile: { node: { displayName: $displayName } } }
    ) {
      users {
        username
        ModerationProfile {
          displayName
        }
      }
    }
  }
`;
