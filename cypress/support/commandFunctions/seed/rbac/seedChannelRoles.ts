import channelRoles from "../../../seedData/rbac/channelRoles";

const seedChannels = () => {
  cy.authenticatedGraphQL(
    `
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
    {
      input: channelRoles,
    }
  );
};
export default seedChannels;
