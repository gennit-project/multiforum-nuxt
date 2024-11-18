const deleteTags = () => {
  cy.authenticatedGraphQL(`
    mutation deleteEmail {
      deleteTags {
        nodesDeleted
      }
    }
 `);
};
export default deleteTags;
