import { gql } from "@apollo/client/core";

export const UPDATE_SERVER_CONFIG = gql`
  mutation updateServerConfig($input: ServerConfigUpdateInput) {
    updateServerConfigs(where: { serverName: "Listical" }, update: $input) {
      serverConfigs {
        serverName
        serverDescription
        rules
      }
    }
  }
`;
