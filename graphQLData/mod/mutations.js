import { gql } from "@apollo/client/core";

export const INVITE_FORUM_OWNER = gql`
  mutation inviteForumOwner($inviteeUsername: String!, $channelUniqueName: String!) {
    inviteForumOwner(inviteeUsername: $inviteeUsername, channelUniqueName: $channelUniqueName)
  }
`;

export const INVITE_FORUM_MOD = gql`
  mutation inviteForumMod($inviteeUsername: String!, $channelUniqueName: String!) {
    inviteForumMod(inviteeUsername: $inviteeUsername, channelUniqueName: $channelUniqueName)
  }
`;

export const CANCEL_INVITE_FORUM_OWNER = gql`
  mutation cancelInviteForumOwner($inviteeUsername: String!, $channelUniqueName: String!) {
    cancelInviteForumOwner(inviteeUsername: $inviteeUsername, channelUniqueName: $channelUniqueName)
  }
`;

export const CANCEL_INVITE_FORUM_MOD = gql`
  mutation cancelInviteForumMod($inviteeUsername: String!, $channelUniqueName: String!) {
    cancelInviteForumMod(inviteeUsername: $inviteeUsername, channelUniqueName: $channelUniqueName)
  }
`;

export const REMOVE_FORUM_OWNER = gql`
  mutation removeForumOwner($username: String!, $channelUniqueName: String!) {
    removeForumOwner(username: $username, channelUniqueName: $channelUniqueName)
  }
`;

export const REMOVE_FORUM_MOD = gql`
  mutation removeForumMod($username: String!, $channelUniqueName: String!) {
    removeForumMod(username: $username, channelUniqueName: $channelUniqueName)
  }
`;

export const ACCEPT_FORUM_OWNER_INVITE = gql`
  mutation acceptInviteForumOwner($channelId: String!) {
    acceptForumOwnerInvite(channelUniqueName: $channelId)
  }
`;

export const ACCEPT_FORUM_MOD_INVITE = gql`
  mutation acceptInviteForumMod($channelId: String!) {
    acceptForumModInvite(channelUniqueName: $channelId)
  }
`;

export const SUSPEND_USER = gql`
  mutation suspendUser(
    $issueID: ID!
    $suspendUntil: DateTime
    $suspendIndefinitely: Boolean
    $explanation: String
  ) {
    suspendUser(
      issueId: $issueID
      suspendUntil: $suspendUntil
      suspendIndefinitely: $suspendIndefinitely
      explanation: $explanation
    ) {
      id
    }
  }
`;

export const UNSUSPEND_USER = gql`
  mutation unsuspendUser($issueId: ID!, $explanation: String) {
    unsuspendUser(issueId: $issueId, explanation: $explanation) {
      id
    }
  }
`;
