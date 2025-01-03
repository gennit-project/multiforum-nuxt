import { gql } from "@apollo/client/core";

export const GET_SERVER_CONFIG = gql`
  query getServerConfig {
    serverConfigs {
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
    }
  }
`;
