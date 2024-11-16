import modServerRoles from "../../../seedData/rbac/modServerRoles";

const seedModServerRoles = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
              mutation createModServerRole (
                  $input: [ModServerRoleCreateInput!]!
              ){
              createModServerRoles (
                  input: $input
              ) {
                  modServerRoles {
                    name
                  }
                }
              }
              `,
      variables: {
        input: modServerRoles,
      },
    },
  });
};

export default seedModServerRoles;
