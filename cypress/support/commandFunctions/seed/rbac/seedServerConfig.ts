import serverConfigs from '../../../seedData/rbac/serverConfigs';

const seedServerConfig = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
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
      variables: {
        input: serverConfigs,
      },
    },
  });
};

export default seedServerConfig;
