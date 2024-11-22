import modServerRoles from "../../../seedData/rbac/modServerRoles";

const seedModServerRoles = () => {
  cy.authenticatedGraphQL(
    `
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
    {
      input: modServerRoles,
    }
  );
};

export default seedModServerRoles;
