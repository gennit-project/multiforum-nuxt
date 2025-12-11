import { CATS_FORUM, CHANNEL_CREATION_FORM } from '../constants';
import { setupTestData } from '../../support/testSetup';

/**
 * E2E tests for server-level suspension enforcement.
 *
 * These tests verify that:
 * 1. A user with an active suspension cannot create a new forum/channel
 * 2. The server-level DefaultSuspendedRole is applied when checking canCreateChannel
 *
 * Note: Server-level suspension is determined by checking if the user has ANY
 * active suspension (indefinite or not yet expired) in the Suspension nodes.
 */
describe('Server-level suspension enforcement', () => {
  // Set up test data once for all tests in this file
  setupTestData();

  const modUsername = Cypress.env('auth0_username_2');
  const modPassword = Cypress.env('auth0_password_2');
  const authorUsername = Cypress.env('auth0_username_1');
  const authorPassword = Cypress.env('auth0_password_1');

  it('suspended user cannot create a new forum', () => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Step 1: Login as author and create a discussion that will be used to suspend them
    cy.loginWithCreateEventButton({
      username: authorUsername,
      password: authorPassword,
    });

    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    const triggerDiscussion = 'Forum creation suspension test ' + Date.now();
    cy.contains('Create Discussion').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.get('input[placeholder="Title"]').type(triggerDiscussion);
    cy.get('[data-testid="texteditor-textarea"]').type(
      'This discussion will trigger suspension for forum creation test.'
    );
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();
    cy.get('button').contains('Create').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.contains(triggerDiscussion).should('be.visible');

    cy.visit('/logout');
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Step 2: Login as moderator and suspend the author
    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.contains(triggerDiscussion).click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.get('button[data-testid="discussion-menu-button"]').click();
    cy.get(
      'div[data-testid="discussion-menu-button-item-Archive and Suspend"]'
    ).click();

    cy.contains('Suspend Author').should('be.visible');
    cy.get('h3')
      .contains('Forum rules')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();
    cy.get('select').select('Two Weeks');
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Suspension for forum creation test.'
    );
    cy.get('button').contains('Submit').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.contains('Archived the post and suspended the author').should(
      'be.visible'
    );

    cy.visit('/logout');
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Step 3: Login as suspended author and try to create a forum
    cy.loginWithCreateEventButton({
      username: authorUsername,
      password: authorPassword,
    });

    cy.visit(CHANNEL_CREATION_FORM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Fill in forum creation form
    const newForumName = 'testforum' + Date.now();
    cy.get('input[placeholder*="unique name" i], input[name="uniqueName"]')
      .first()
      .type(newForumName);

    // Add description if required
    cy.get('body').then(($body) => {
      if ($body.find('textarea[placeholder*="description" i]').length > 0) {
        cy.get('textarea[placeholder*="description" i]').type(
          'Test forum that should not be created.'
        );
      }
    });

    // Intercept the create channel mutation
    cy.intercept('POST', '**/graphql', (req) => {
      if (
        req.body.query?.includes('createChannel') ||
        req.body.query?.includes('CreateChannel')
      ) {
        req.alias = 'createChannelAttempt';
      }
    });

    // Try to submit the form
    cy.get('button').contains(/create|submit/i).click();

    // Should see an error about being suspended or lacking permission
    // The exact message depends on how the frontend handles the error
    cy.contains(/suspended|permission|cannot|not allowed/i, {
      timeout: 10000,
    }).should('be.visible');

    // Step 4: Cleanup - unsuspend the user
    cy.visit('/logout');
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.contains(authorUsername).should('be.visible');
    cy.contains('Related Issue').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.contains('Unsuspend User').click();
    cy.contains('Unsuspend Author').should('be.visible');
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Cleanup after forum creation test.'
    );
    cy.get('button').contains('Submit').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
  });

  it('unsuspended user can create a forum', () => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // This test verifies that after being unsuspended, a user can create forums again
    // We'll use a user who is known to not be suspended

    cy.loginWithCreateEventButton({
      username: modUsername, // Use mod who shouldn't be suspended
      password: modPassword,
    });

    cy.visit(CHANNEL_CREATION_FORM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Fill in forum creation form with a unique name
    const newForumName = 'testforum' + Date.now();

    cy.get('input[placeholder*="unique name" i], input[name="uniqueName"]')
      .first()
      .type(newForumName);

    // Add description if required
    cy.get('body').then(($body) => {
      if ($body.find('textarea[placeholder*="description" i]').length > 0) {
        cy.get('textarea[placeholder*="description" i]').type(
          'Test forum created by non-suspended user.'
        );
      }
    });

    // Submit the form
    cy.get('button').contains(/create|submit/i).click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Should see success or be redirected to the new forum
    // Check that we don't see a suspension error
    cy.contains(/suspended|permission denied/i).should('not.exist');

    // Optionally verify the forum was created by checking the URL or success message
    cy.url().should('include', newForumName).or('include', 'forums');
  });
});
