const deleteEmails = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
            mutation deleteEmail {
              deleteEmails {
                nodesDeleted
              }
            }
            `,
    },
  });
};
export default deleteEmails;
