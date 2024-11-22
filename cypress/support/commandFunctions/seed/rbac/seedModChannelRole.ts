import modChannelRoles from "../../../seedData/rbac/modChannelRoles";

const seedModChannelRoles = () => {
  cy.authenticatedGraphQL(
    `
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
    {
      input: modChannelRoles,
    }
  );
};

export default seedModChannelRoles;
