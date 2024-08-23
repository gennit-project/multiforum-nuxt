const deleteUsers = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
              mutation deleteUser {
                deleteUsers {
                  nodesDeleted
                }
              }
              `,
    },
  });
};
export default deleteUsers;
