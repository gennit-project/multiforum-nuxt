const deleteChannels = () => {
  cy.safetyCheck();

  cy.authenticatedGraphQL(`
    mutation deleteChannel {
      deleteChannels {
        nodesDeleted
      }
    }
  `);
};
export default deleteChannels;