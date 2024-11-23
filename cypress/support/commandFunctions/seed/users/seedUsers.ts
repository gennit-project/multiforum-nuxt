import users from "./users";

const seedUsers = () => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    cy.authenticatedGraphQL(
      `
          mutation CreateUsers($emailAddress: String!, $username: String!) {
              createEmailAndUser(emailAddress: $emailAddress, username: $username) {
                username
                Email {
                  address
                }
              }
            }
        `,
      {
        emailAddress: user.emailAddress,
        username: user.username,
      }
    );
  }
};

export default seedUsers;
