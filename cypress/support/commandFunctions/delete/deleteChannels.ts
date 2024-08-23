const deleteChannels = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
            mutation deleteChannel {
              deleteChannels {
                nodesDeleted
              }
            }
            `,
    },
  });
};
export default deleteChannels;
