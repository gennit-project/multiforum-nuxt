const deleteChannels = () => {
  cy.authenticatedGraphQL(`
    mutation deleteChannel {
      deleteChannels {
        nodesDeleted
      }
    }
  `);
};
export default deleteChannels;