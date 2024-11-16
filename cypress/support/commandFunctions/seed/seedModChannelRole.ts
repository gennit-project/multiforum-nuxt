import modChannelRoles from "../../seedData/modChannelRoles.js";

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
