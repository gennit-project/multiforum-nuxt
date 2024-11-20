const deleteEmails = () => {
  cy.safetyCheck().then(() => {
    cy.authenticatedGraphQL(`
     mutation deleteEmail {
        deleteEmails {
          nodesDeleted
        }
      }
  `);
  });
};
export default deleteEmails;
