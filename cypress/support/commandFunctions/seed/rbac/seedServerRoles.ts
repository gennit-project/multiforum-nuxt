import serverRoles from "../../../seedData/rbac/serverRoles";
const seedServerConfig = () => {
  cy.authenticatedGraphQL(
    `
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
    {
      input: serverRoles,
    }
  );
};

export default seedServerConfig;
