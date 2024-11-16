import channelRoles from "../../seedData/channelRoles.js";

const seedChannelRoles = () => {
  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      query: `
              mutation createChannelRoles (
                  $input: [ChannelRoleCreateInput!]!
              ){
              createChannelRoles (
                  input: $input
              ) {
                  channelRoles {
                    name
                  }
                }
              }
              `,
      variables: {
        input: channelRoles,
      },
    },
  });
};

export default seedChannelRoles;
