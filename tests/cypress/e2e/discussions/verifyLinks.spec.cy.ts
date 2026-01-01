import { CATS_FORUM, DISCUSSION_CREATION_FORM } from '../constants';
import { setupTestData } from '../../support/testSetup';
import { loginWithAuthUser, waitForGraphQL } from '../utils';

describe('Discussion moderation link verification', () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it('verifies navigation links between archived discussion, issue, and original context', () => {
    // Test data
    const discussionTitle =
      'Test discussion for link verification ' + Date.now();

    // Credentials
    // Set up network interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Login as regular user to create discussion
    loginWithAuthUser('user1');

    // Create a test discussion
    cy.visit(DISCUSSION_CREATION_FORM);
    waitForGraphQL();

    cy.get('[data-testid="title-input"]').type(discussionTitle);
    cy.get('[data-testid="body-input"]').type(
      'This is a test discussion for verifying links.'
    );
    cy.get('[data-testid="channel-input"]').type('cats{enter}');
    cy.get('[data-testid="forum-picker-cats"]').click();
    cy.get('button').contains('Save').click();
    waitForGraphQL();

    // Verify discussion was created
    cy.contains(discussionTitle).should('be.visible');

    // Store the discussion URL
    cy.url().then((originalDiscussionUrl) => {
      // Switch to moderator account
      cy.get('[data-testid="logout-button"]').click();
      cy.wait(2000);

      loginWithAuthUser('user2');

      // Navigate to the discussion
      cy.visit(originalDiscussionUrl);
      waitForGraphQL();

      // Open the action menu
      cy.get('[data-testid="discussion-menu-button"]').click();

      // Select archive option
      cy.get('[data-testid="discussion-menu-button-item-Archive"]').click();

      // Complete archive form
      cy.contains('Archive Discussion').should('be.visible');
      cy.get('h3')
        .contains('Forum rules')
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .check();
      cy.get('[data-testid="report-discussion-input"]').type(
        'Testing discussion link verification'
      );
      cy.get('button').contains('Submit').click();
      waitForGraphQL();

      // Verify archived banner appears with link
      cy.get('[data-testid="archived-discussion-banner"]').should('be.visible');
      cy.get('[data-testid="archived-discussion-banner"]')
        .contains('View related issue')
        .should('be.visible');

      // Click link to issue
      cy.get('[data-testid="archived-discussion-banner"]')
        .contains('View related issue')
        .click();
      waitForGraphQL();

      // Verify we're on the issue page
      cy.contains('Issue Details').should('be.visible');

      // Store issue URL
      cy.url().then((issueUrl) => {
        // Find link back to original discussion
        cy.get('#original-post-container').contains(discussionTitle).click();
        waitForGraphQL();

        // Verify we returned to the original discussion
        cy.url().should('eq', originalDiscussionUrl);
        cy.get('[data-testid="archived-discussion-banner"]').should(
          'be.visible'
        );

        // Return to issue
        cy.visit(issueUrl);
        waitForGraphQL();

        // Unarchive from issue
        cy.contains('Unarchive').click();
        cy.contains('Unarchive Discussion').should('be.visible');
        cy.get('textarea').type('Unarchiving for test cleanup');
        cy.get('button').contains('Unarchive').click();
        waitForGraphQL();

        // Navigate back to discussion
        cy.get('#original-post-container').contains(discussionTitle).click();
        waitForGraphQL();

        // Verify discussion is no longer archived
        cy.get('[data-testid="archived-discussion-banner"]').should(
          'not.exist'
        );
      });
    });
  });

  it('verifies links between reported discussion feedback, issue, and original discussion', () => {
    // Test data
    const discussionTitle =
      'Test discussion for feedback verification ' + Date.now();
    const feedbackText = 'Test feedback for discussion link verification';

    // Credentials
    // Set up network interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Login as regular user to create discussion
    loginWithAuthUser('user1');

    // Create a test discussion
    cy.visit(DISCUSSION_CREATION_FORM);
    waitForGraphQL();

    cy.get('[data-testid="title-input"]').type(discussionTitle);
    cy.get('[data-testid="body-input"]').type(
      'This is a test discussion for feedback link verification.'
    );
    cy.get('[data-testid="channel-input"]').type('cats{enter}');
    cy.get('[data-testid="forum-picker-cats"]').click();
    cy.get('button').contains('Save').click();
    waitForGraphQL();

    // Verify discussion was created
    cy.contains(discussionTitle).should('be.visible');

    // Store the discussion URL
    cy.url().then((originalDiscussionUrl) => {
      // Switch to moderator account
      cy.get('[data-testid="logout-button"]').click();
      cy.wait(2000);

      loginWithAuthUser('user2');

      // Navigate to the discussion
      cy.visit(originalDiscussionUrl);
      waitForGraphQL();

      // Open the action menu
      cy.get('[data-testid="discussion-menu-button"]').click();

      // Select give feedback option
      cy.get(
        '[data-testid="discussion-menu-button-item-Give Feedback"]'
      ).click();

      // Fill in feedback form
      cy.contains('Give Feedback').should('be.visible');
      cy.get('[data-testid="report-discussion-input"]').type(feedbackText);
      cy.get('button').contains('Submit').click();
      waitForGraphQL();

      // Verify feedback submitted successfully
      cy.contains('Feedback submitted successfully').should('be.visible');

      // Navigate to feedback tab
      cy.get('[data-testid="feedback-tab"]').click();
      waitForGraphQL();

      // Report the feedback
      cy.contains(feedbackText)
        .closest('[data-testid="discussion-feedback"]')
        .find('[data-testid="report-feedback-button"]')
        .click();

      // Complete report form
      cy.contains('Report Feedback').should('be.visible');
      cy.get('h3')
        .contains('Forum rules')
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .check();
      cy.get('[data-testid="report-input"]').type(
        'Testing discussion feedback link verification'
      );
      cy.get('button').contains('Submit').click();
      waitForGraphQL();

      // Navigate to issues page
      cy.visit(`${CATS_FORUM.replace('discussions', 'issues')}`);
      waitForGraphQL();

      // Find and click on the issue for our feedback
      cy.contains('Feedback on discussion').click();
      waitForGraphQL();

      // Store issue URL
      cy.url().then((issueUrl) => {
        // Verify we can navigate from issue to original feedback
        cy.get('#original-post-container')
          .contains('View original feedback')
          .click();
        waitForGraphQL();

        // Verify we're on the feedback permalink page
        cy.contains(feedbackText).should('be.visible');

        // Verify we can get back to the original discussion
        cy.contains('View in discussion').click();
        waitForGraphQL();

        // Verify we're back at the original discussion
        cy.url().should('include', originalDiscussionUrl.split('?')[0]);
        cy.contains(discussionTitle).should('be.visible');

        // Clean up: Go back to issue and archive the feedback
        cy.visit(issueUrl);
        waitForGraphQL();

        cy.contains('Archive').click();
        cy.contains('Archive Feedback').should('be.visible');
        cy.get('textarea').type('Archiving for test cleanup');
        cy.get('button').contains('Archive').click();
        waitForGraphQL();

        // Verify archive was successful
        cy.contains('Content archived successfully').should('be.visible');
      });
    });
  });
});
