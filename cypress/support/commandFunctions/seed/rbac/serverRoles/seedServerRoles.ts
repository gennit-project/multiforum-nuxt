import type { ServerRoleCreateInput } from "../../../../../../__generated__/graphql";

const serverRoles: ServerRoleCreateInput[] = [
  {
    name: "CanCreateAnything",
    description: "Intended to be a default server role",
    canCreateChannel: true,
    canCreateComment: true,
    canCreateDiscussion: true,
    canCreateEvent: true,
    canGiveFeedback: true,
    canUploadFile: true,
    canUpvoteComment: true,
    canUpvoteDiscussion: true,
    showAdminTag: false,
  },
  {
    name: "Admin Role",
    description: "A role for admins",
    canCreateChannel: true,
    canCreateComment: true,
    canCreateDiscussion: true,
    canCreateEvent: true,
    canGiveFeedback: true,
    canUploadFile: true,
    canUpvoteComment: true,
    canUpvoteDiscussion: true,
    showAdminTag: true,
  },
  {
    name: "Suspended Role",
    description: "A role for suspended users",
    canCreateChannel: false,
    canCreateComment: false,
    canCreateDiscussion: false,
    canCreateEvent: false,
    canGiveFeedback: false,
    canUploadFile: false,
    canUpvoteComment: false,
    canUpvoteDiscussion: false,
    showAdminTag: false,
  }
];

const seedServerConfig = () => {
  cy.authenticatedGraphQL(
    `
      mutation createServerRoles (
          $input: [ServerRoleCreateInput!]!
      ){
      createServerRoles (
          input: $input
      ) {
          serverRoles {
          name
          }
        }
      }
      `,
    {
      input: serverRoles,
    }
  );
};

export default seedServerConfig;
