export const deleteAll = () => {
  cy.loginAsAdmin();

  cy.deleteEvents();
  cy.deleteEmails();
  cy.deleteUsers();
  cy.deleteChannels();
  cy.deleteTags();
  cy.deleteDiscussions();
  cy.deleteComments();
  cy.deleteEventChannels();
  cy.deleteDiscussionChannels();

  // RBAC
  cy.deleteChannelRoles();
  cy.deleteModChannelRoles();
  cy.deleteServerRoles();
  cy.deleteModServerRoles();
  cy.deleteServerConfigs();
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
