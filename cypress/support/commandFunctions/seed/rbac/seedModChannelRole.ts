import modChannelRoles from "../../../seedData/rbac/modChannelRoles.js";

const seedModChannelRoles = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
              mutation createModChannelRoles (
                  $input: [ModChannelRoleCreateInput!]!
              ){
              createModChannelRoles (
                  input: $input
              ) {
                  modChannelRoles {
                    name
                  }
                }
              }
              `,
      variables: {
        input: modChannelRoles,
      },
    },
  });
};

export default seedModChannelRoles;
