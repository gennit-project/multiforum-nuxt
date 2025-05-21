import channels from "../support/commandFunctions/seedData/seedChannels";
import discussions from "../support/commandFunctions/seedData/seedDiscussions";
import events from "../support/commandFunctions/seedData/seedEvents";
import tags from "../support/commandFunctions/seedData/seedTags";
import channelRoles from "../support/commandFunctions/seedData/rbac/seedChannelRoles";
import modChannelRoles from "../support/commandFunctions/seedData/rbac/seedModChannelRoles";
import serverRoles from "../support/commandFunctions/seedData/rbac/seedServerRoles";
import modServerRoles from "../support/commandFunctions/seedData/rbac/seedModServerRoles";
import serverConfigs from "../support/commandFunctions/seedData/rbac/seedServerConfig";
import users from "../support/commandFunctions/seedData/seedUsers";

export const deleteAll = () => {
  cy.loginAsAdmin();
  cy.dropDataForCypressTests().then((response) =>
    validateResponse(response, "dropDataForCypressTests")
  );
};

// Helper function to validate the response
const validateResponse = (response, commandName) => {
  if (!response || response.status >= 400 || (response.body && response.body.errors)) {
    const errorDetails =
      response.body?.errors
        ?.map((error) => {
          return `Message: ${error.message}, Path: ${JSON.stringify(error.path)}, Extensions: ${JSON.stringify(error.extensions)}`;
        })
        .join("\n") || "No detailed error available";

    cy.log(`Error in ${commandName}: ${errorDetails}`);
    throw new Error(`${commandName} failed with errors: ${errorDetails}`);
  }

  cy.log(`${commandName} succeeded`);
};

export const seedAll = () => {
  // The order is important here because some
  // have a dependency on the previous seed data.

  cy.seedDataForCypressTests({
    channels,
    comments: [], // May add some seed comments later if needed.
    discussions,
    events,
    tags,
    users,
    channelRoles,
    modChannelRoles,
    serverRoles,
    modServerRoles,
    serverConfigs,
  }).then((response) => validateResponse(response, "seedDataForCypressTests"));
};
