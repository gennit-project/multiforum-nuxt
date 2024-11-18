const deleteEmails = () => {
  cy.authenticatedGraphQL(`
     mutation deleteEmail {
        deleteEmails {
          nodesDeleted
        }
      }
  `);
};
export default deleteEmails;
