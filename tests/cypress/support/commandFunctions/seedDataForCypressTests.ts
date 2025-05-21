import type { SeedDataInput } from "../types";

const seedDataForCypressTests = (input: SeedDataInput) => {
  const {
    channels,
    discussions,
    events,
    comments,
    tags,
    users,
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
      $discussions: [DiscussionCreateInputWithChannels!]!, 
      $events: [EventCreateInputWithChannels!]!, 
      $users: [NewUserInput!]!, 
      $tags: [TagCreateInput!]!, 
      $comments: [CommentCreateInput!]!
      $channelRoles: [ChannelRoleCreateInput!]!
      $modChannelRoles: [ModChannelRoleCreateInput!]!
      $serverRoles: [ServerRoleCreateInput!]!
      $modServerRoles: [ModServerRoleCreateInput!]!
      $serverConfigs: [ServerConfigCreateInput!]!
    ) {
        seedDataForCypressTests(
          channels: $channels, 
          users: $users, 
          tags: $tags, 
          discussions: $discussions, 
          events: $events, 
          comments: $comments
          channelRoles: $channelRoles
          modChannelRoles: $modChannelRoles
          serverRoles: $serverRoles
          modServerRoles: $modServerRoles
          serverConfigs: $serverConfigs
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
      comments,
      tags,
      users,
      channelRoles,
      modChannelRoles,
      serverRoles,
      modServerRoles,
      serverConfigs,
    }
  ).then((response) => {
    const data = response?.body?.data?.seedDataForCypressTests;
    if (!data) {
      throw new Error(`🚨 seedDataForCypressTests failed: ${JSON.stringify(response)}`);
    }
  });
};

export default seedDataForCypressTests;
