const deleteUsers = () => {
  cy.authenticatedGraphQL(`
   mutation deleteUser {
      deleteUsers {
        nodesDeleted
      }
    }
 `);
};
export default deleteUsers;
