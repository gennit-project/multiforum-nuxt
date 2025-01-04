import { gql } from "@apollo/client/core";

export const GET_SERVER_CONFIG = gql`
  query getServerConfig (
    $serverName: String!
  ){
    serverConfigs(
      where: {
        serverName: $serverName
      }
    ) {
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

export const GET_SERVER_RULES = gql`
  query getServerRules {
    serverConfigs {
      rules
    }
  }
`;