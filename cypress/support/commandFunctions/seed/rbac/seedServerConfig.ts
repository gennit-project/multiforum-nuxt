import serverConfigs from "../../../seedData/rbac/serverConfigs";

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
};

export default seedServerConfig;
