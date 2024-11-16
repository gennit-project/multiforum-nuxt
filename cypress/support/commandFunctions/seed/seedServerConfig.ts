import serverConfigs from '../../seedData/serverConfigs';

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
                    name
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
