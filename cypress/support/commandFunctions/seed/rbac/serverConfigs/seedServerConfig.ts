import type { ServerConfigCreateInput } from "../../../../../../__generated__/graphql";

const serverConfigs: ServerConfigCreateInput[] = [
  {
    serverName: "Cypress Test Server",
  },
];

const seedServerConfig = () => {
  cy.authenticatedGraphQL(
    `
    mutation createServerConfig (
        $input: [ServerConfigCreateInput!]!
    ){
    createServerConfigs (
        input: $input
    ) {
        serverConfigs {
          serverName
        }
      }
    }
    `,
    {
      input: serverConfigs,
    }
  );

  // In a separate call, attach the default server role to the server config.
  cy.authenticatedGraphQL(
    `
    mutation updateServerConfig(
      $where: ServerConfigWhere,
      $update: ServerConfigUpdateInput
    ) {
      updateServerConfigs (
        where: $where,
        update: $update
      ) {
        serverConfigs {
          serverName 
          DefaultServerRole {
            name
          }
        }
      }
    }
    `,
    {
      where: {
        serverName: "Cypress Test Server",
      },
      update: {
        DefaultServerRole: {
          connect: {
            where: {
              node: {
                name: "CanCreateAnything",
              },
            },
            overwrite: true,
          },
        },
      },
    }
  );
};
export default seedServerConfig;
