export const deleteAll = () => {
  cy.loginAsAdmin(); // Log in first

  // Chain all deletions and ensure they throw errors if any fail
  cy.deleteEvents()
    .then((response) => validateResponse(response, "deleteEvents"))
    .then(() => cy.deleteEmails())
    .then((response) => validateResponse(response, "deleteEmails"))
    .then(() => cy.deleteUsers())
    .then((response) => validateResponse(response, "deleteUsers"))
    .then(() => cy.deleteChannels())
    .then((response) => validateResponse(response, "deleteChannels"))
    .then(() => cy.deleteTags())
    .then((response) => validateResponse(response, "deleteTags"))
    .then(() => cy.deleteDiscussions())
    .then((response) => validateResponse(response, "deleteDiscussions"))
    .then(() => cy.deleteComments())
    .then((response) => validateResponse(response, "deleteComments"))
    .then(() => cy.deleteEventChannels())
    .then((response) => validateResponse(response, "deleteEventChannels"))
    .then(() => cy.deleteDiscussionChannels())
    .then((response) => validateResponse(response, "deleteDiscussionChannels"))
    .then(() => cy.deleteChannelRoles())
    .then((response) => validateResponse(response, "deleteChannelRoles"))
    .then(() => cy.deleteModChannelRoles())
    .then((response) => validateResponse(response, "deleteModChannelRoles"))
    .then(() => cy.deleteServerRoles())
    .then((response) => validateResponse(response, "deleteServerRoles"))
    .then(() => cy.deleteModServerRoles())
    .then((response) => validateResponse(response, "deleteModServerRoles"))
    .then(() => cy.deleteServerConfigs())
    .then((response) => validateResponse(response, "deleteServerConfigs"));
};

// Helper function to validate the response
const validateResponse = (response, commandName) => {
  // Log the entire response for debugging purposes
  cy.log(`Response for ${commandName}: ${JSON.stringify(response)}`);

  if (!response || response.status >= 400 || (response.body && response.body.errors)) {
    const errorDetails = response.body?.errors?.map((error) => {
      return `Message: ${error.message}, Path: ${JSON.stringify(error.path)}, Extensions: ${JSON.stringify(error.extensions)}`;
    }).join("\n") || "No detailed error available";

    cy.log(`Error in ${commandName}: ${errorDetails}`);
    throw new Error(`${commandName} failed with errors: ${errorDetails}`);
  }

  cy.log(`${commandName} succeeded`);
};

export const seedAll = () => {
  // The order is important here because each
  // has a dependency on the previous.
  cy.seedUsers();
  cy.seedChannels();
  cy.seedTags();
  cy.seedEvents();
  cy.seedDiscussions();

  // RBAC
  cy.seedModChannelRoles();
  cy.seedChannelRoles();
  cy.seedModServerRoles()
  cy.seedServerRoles()
  cy.seedServerConfig()
};
