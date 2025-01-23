import { gql } from "@apollo/client/core";

export const INVITE_FORUM_OWNER = gql`
  mutation inviteForumOwner(
    $inviteeUsername: String!
    $channelUniqueName: String!
  ) {
    inviteForumOwner(
      inviteeUsername: $inviteeUsername
      channelUniqueName: $channelUniqueName
    )
  }
`;

export const CANCEL_INVITE_FORUM_OWNER = gql`
  mutation cancelInviteForumOwner(
    $inviteeUsername: String!
    $channelUniqueName: String!
  ) {
    cancelInviteForumOwner(
      inviteeUsername: $inviteeUsername
      channelUniqueName: $channelUniqueName
    )
  }
`;

export const REMOVE_FORUM_OWNER = gql`
  mutation removeForumOwner($username: String!, $channelUniqueName: String!) {
    removeForumOwner(username: $username, channelUniqueName: $channelUniqueName)
  }
`;
