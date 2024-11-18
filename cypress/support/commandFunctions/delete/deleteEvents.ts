const deleteEvents = () => {
  cy.authenticatedGraphQL(`
   mutation deleteEvent {
      deleteEvents {
        nodesDeleted
      }
    }
`);
  cy.authenticatedGraphQL(`
  mutation deleteEventChannel {
      deleteEventChannels {
        nodesDeleted
      }
    }
`);
};
export default deleteEvents;
