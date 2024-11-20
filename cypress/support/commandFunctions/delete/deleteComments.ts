export const deleteComments = () => {
  cy.authenticatedGraphQL(`
      mutation deleteComments {
        deleteComments {
          nodesDeleted
        }
      }
    `);
};
export const deleteDiscussionChannels = () => {
  cy.authenticatedGraphQL(`
        mutation deleteDiscussionChannels {
            deleteDiscussionChannels {
            nodesDeleted
            }
        }
        `);
};

export const deleteEventChannels = () => {
  cy.authenticatedGraphQL(`
        mutation deleteEventChannels {
            deleteEventChannels {
            nodesDeleted
            }
        }
        `);
};
