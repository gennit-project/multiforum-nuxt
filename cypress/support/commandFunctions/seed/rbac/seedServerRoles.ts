import serverRoles from "../../../seedData/rbac/serverRoles.js";

const seedServerRoles = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
              mutation createServerRoles (
                  $input: [ServerRoleCreateInput!]!
              ){
              createServerRoles (
                  input: $input
              ) {
                  serverRoles {
                  name
                  }
                }
              }
              `,
      variables: {
        input: serverRoles,
      },
    },
  });
};

export default seedServerRoles;
