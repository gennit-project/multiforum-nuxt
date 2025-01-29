import { gql } from "@apollo/client/core";

export const GET_SERVER_CONFIG = gql`
  query getServerConfig($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      serverIconURL
      serverDescription
      DefaultServerRole {
        name
        description
      }
      DefaultChannelRole {
        name
        description
      }
      DefaultModRole {
        name
        description
      }
      DefaultModChannelRole {
        name
        channelUniqueName
      }
      rules
    }
  }
`;

export const GET_SERVER_PERMISSIONS = gql`
  query getServerConfig($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      DefaultChannelRole {
        name
        description
        canCreateComment
        canCreateDiscussion
        canCreateEvent
        canUpdateChannel
        canUploadFile
        canUpvoteComment
        canUpvoteDiscussion
        showModTag
      }
      DefaultModChannelRole {
        name
        description
        canGiveFeedback
        canCloseSupportTickets
        canHideComment
        canHideDiscussion
        canHideEvent
        canReport
        canOpenSupportTickets
      }
      DefaultModRole {
        name
        description
        canGiveFeedback
        canCloseSupportTickets
        canOpenSupportTickets
        canLockChannel
      }
      DefaultServerRole {
        name
        description
        canUpvoteDiscussion
        canUpvoteComment
        canUploadFile
        canGiveFeedback
        canCreateEvent
        canCreateDiscussion
        canCreateComment
        canCreateChannel
      }
    }
  }
`;

export const GET_SERVER_RULES = gql`
  query getServerRules {
    serverConfigs {
      serverName
      rules
    }
  }
`;
