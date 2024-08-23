import users from "../../seedData/users";

const seedUsers = () => {
  for (let i = 0; i < users.length; i++) {
    const operation = {
      query: `
          mutation CreateUsers($emailAddress: String!, $username: String!) {
            createEmailAndUser(emailAddress: $emailAddress, username: $username) {
              username
              Email {
                address
              }
            }
          }
        `,
      variables: {
        emailAddress: users[i].emailAddress,
        username: users[i].username,
      },
    };

    cy.request({
      url: "http://localhost:4000/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: operation,
    });
  }
};

export default seedUsers;
