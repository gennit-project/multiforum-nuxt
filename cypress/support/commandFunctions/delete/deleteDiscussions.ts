const deleteDiscussions = () => {
  cy.safetyCheck();
  
  cy.authenticatedGraphQL(`
    mutation deleteDiscussion {
      deleteDiscussions {
        nodesDeleted
      }
    }
  `);

  cy.authenticatedGraphQL(`
   mutation deleteDiscussionChannel {
    deleteDiscussionChannels {
      nodesDeleted
    }
  }
  `);
};
export default deleteDiscussions;
