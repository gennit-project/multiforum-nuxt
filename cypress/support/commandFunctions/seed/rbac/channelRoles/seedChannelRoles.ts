import type { ChannelRoleCreateInput } from "../../../../__generated__/graphql";

const channelRoles: ChannelRoleCreateInput[] = [
  {
    name: "Basic mod role for /cats",
    description: "Standard mod permissions",
    channelUniqueName: "cats",
    showModTag: true,
    canCreateComment: true,
    canCreateDiscussion: true,
    canCreateEvent: true,
    canUpdateChannel: true,
    canUploadFile: true,
    canUpvoteComment: true,
    canUpvoteDiscussion: true,
  },
];

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
