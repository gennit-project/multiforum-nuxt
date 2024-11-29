import type { SeedDataInput } from "../types";

const seedDataForCypressTests = (input: SeedDataInput) => {
  const {
    channels,
    discussions,
    events,
    tags,
    channelRoles,
    modChannelRoles,
    serverRoles,
    modServerRoles,
    serverConfigs,
  } = input;

  cy.authenticatedGraphQL(
    `
    mutation seedDataForCypress(
      $channels: [ChannelCreateInput!]!, 
      $users: [UserCreateInput!]!, 
      $tags: [TagCreateInput!]!, 
      $discussions: [DiscussionCreateInput!]!, 
      $events: [EventCreateInput!]!, 
      $comments: [CommentCreateInput!]!
    ) {
        seedDataForCypressTests(
          channels: $channels, 
          users: $users, 
          tags: $tags, 
          discussions: $discussions, 
          events: $events, 
          comments: $comments
        ) {
            message
            success
      }
  }
    `,
    {
      channels,
      discussions,
      events,
      tags,
      channelRoles,
      modChannelRoles,
      serverRoles,
      modServerRoles,
      serverConfigs,
    }
  ).then((response) => {
    const data = response?.body?.data?.seedDataForCypressTests;
    if (!data) {
      throw new Error(
        `🚨 seedDataForCypressTests failed: ${JSON.stringify(response)}`
      );
    }
  });
};

export default seedDataForCypressTests;
