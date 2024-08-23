const deleteDiscussions = () => {
    cy.request({
      url: "http://localhost:4000/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        query: `
              mutation deleteDiscussion {
                deleteDiscussions {
                  nodesDeleted
                }
              }
              `,
      },
    });
    cy.request({
      url: "http://localhost:4000/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        query: `
              mutation deleteDiscussionChannel {
                deleteDiscussionChannels {
                  nodesDeleted
                }
              }
              `,
      },
    });
  };
  export default deleteDiscussions;
  