import { gql } from "@apollo/client/core";

export const UPDATE_SERVER_CONFIG = gql`
  mutation updateServerConfig($serverName: String!, $input: ServerConfigUpdateInput) {
    updateServerConfigs(where: { serverName: $serverName }, update: $input) {
      serverConfigs {
        serverName
        serverDescription
        rules
      }
    }
  }
`;