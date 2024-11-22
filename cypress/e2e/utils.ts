export const deleteAll = () => {
  cy.loginAsAdmin();
  cy.dropDataForCypressTests().then((response) =>
    validateResponse(response, "dropDataForCypressTests")
  );
};

// Helper function to validate the response
const validateResponse = (response, commandName) => {
  if (
    !response ||
    response.status >= 400 ||
    (response.body && response.body.errors)
  ) {
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

  cy.seedModChannelRoles()
    .then((response) => validateResponse(response, "seedModChannelRoles"))

    .then(() => cy.seedChannelRoles())
    .then((response) => validateResponse(response, "seedChannelRoles"))

    .then(() => cy.seedModServerRoles())
    .then((response) => validateResponse(response, "seedModServerRoles"))

    .then(() => cy.seedServerRoles())
    .then((response) => validateResponse(response, "seedServerRoles"))

    .then(() => cy.seedServerConfig())
    .then((response) => validateResponse(response, "seedServerConfig"))

    .then(() => cy.seedUsers())
    .then((response) => validateResponse(response, "seedUsers"))

    .then(() => cy.seedChannels())
    .then((response) => validateResponse(response, "seedChannels"))

    .then(() => cy.seedTags())
    .then((response) => validateResponse(response, "seedTags"))

    .then(() => cy.seedEvents())
    .then((response) => validateResponse(response, "seedEvents"))
    
    .then(() => cy.seedDiscussions())
    .then((response) => validateResponse(response, "seedDiscussions"));
};
