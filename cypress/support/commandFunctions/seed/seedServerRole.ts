import serverRoles from "../../seedData/serverRoles";

const seedServerRoles = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
              mutation createServerRole (
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
