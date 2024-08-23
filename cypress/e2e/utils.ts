export const deleteAll = () => {
  cy.deleteEvents();
  cy.deleteEmails();
  cy.deleteUsers();
  cy.deleteChannels();
  cy.deleteTags();
  cy.deleteDiscussions();
};

export const seedAll = () => {
  // The order is important here because each
  // has a dependency on the previous.
  cy.seedUsers();
  cy.seedChannels();
  cy.seedTags();
  cy.seedEvents();
  cy.seedDiscussions();
};
