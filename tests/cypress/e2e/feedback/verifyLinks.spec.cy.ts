import { CATS_FORUM } from '../constants';
import { setupTestData } from '../../support/testSetup';
import { getAuthUser, loginWithAuthUser, waitForGraphQL } from '../utils';

describe('Feedback moderation link verification', () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it('verifies links between discussion feedback, issue, and original content', () => {
    // Test data
    const discussionTitle = 'Example topic 1';
    const feedbackText =
      'Test standalone feedback for link verification ' + Date.now();

    // Set up network interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Login as moderator
    loginWithAuthUser('user2');

    // Navigate to a discussion
    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(discussionTitle).click();
    waitForGraphQL();

    // Open action menu and give feedback
    cy.get('[data-testid="discussion-menu-button"]').click();
    cy.get('[data-testid="discussion-menu-button-item-Give Feedback"]').click();

    // Fill feedback form
    cy.contains('Give Feedback').should('be.visible');
    cy.get('[data-testid="report-discussion-input"]').type(feedbackText);
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    // Verify feedback submitted
    cy.contains('Feedback submitted successfully').should('be.visible');

    // Go to feedback tab
    cy.get('[data-testid="feedback-tab"]').click();
    waitForGraphQL();

    // Store URL of discussion with feedback
    cy.url().then((discussionWithFeedbackUrl) => {
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
        'Testing feedback link verification'
      );
      cy.get('button').contains('Submit').click();
      waitForGraphQL();

      // Verify report success
      cy.contains('Content reported successfully').should('be.visible');

      // Navigate to issues
      cy.visit(`${CATS_FORUM.replace('discussions', 'issues')}`);
      waitForGraphQL();

      // Find and open issue for feedback
      cy.contains('Feedback on discussion').click();
      waitForGraphQL();

      // Store issue URL
      cy.url().then((issueUrl) => {
        // Verify link from issue to feedback permalink
        cy.get('#original-post-container')
          .contains('View original feedback')
          .click();
        waitForGraphQL();

        // Store feedback permalink URL
        cy.url().then((feedbackPermalinkUrl) => {
          // Verify we're looking at the feedback
          cy.contains(feedbackText).should('be.visible');

          // Check link back to discussion
          cy.contains('View in discussion').click();
          waitForGraphQL();

          // Verify we can go from feedback permalink to discussion
          cy.url().should('include', discussionWithFeedbackUrl.split('?')[0]);

          // Go back to issue to test archive flow
          cy.visit(issueUrl);
          waitForGraphQL();

          // Archive the feedback
          cy.contains('Archive').click();
          cy.contains('Archive Feedback').should('be.visible');
          cy.get('textarea').type('Archiving feedback for test');
          cy.get('button').contains('Archive').click();
          waitForGraphQL();

          // Verify archive success
          cy.contains('Content archived successfully').should('be.visible');

          // Go to permalink to verify archived state
          cy.visit(feedbackPermalinkUrl);
          waitForGraphQL();

          // Verify feedback shows as archived
          cy.contains('This feedback has been archived').should('be.visible');
          cy.contains('View related issue').should('be.visible');

          // Follow link back to issue
          cy.contains('View related issue').click();
          waitForGraphQL();

          // Verify we're back at issue
          cy.url().should('eq', issueUrl);

          // Unarchive the feedback
          cy.contains('Unarchive').click();
          cy.contains('Unarchive Feedback').should('be.visible');
          cy.get('textarea').type('Unarchiving for test cleanup');
          cy.get('button').contains('Unarchive').click();
          waitForGraphQL();

          // Go back to permalink to verify unarchived state
          cy.visit(feedbackPermalinkUrl);
          waitForGraphQL();

          // Verify feedback no longer shows as archived
          cy.contains('This feedback has been archived').should('not.exist');
          cy.contains(feedbackText).should('be.visible');
        });
      });
    });
  });

  it('verifies suspending and unsuspending user from feedback context', () => {
    // Test data
    const discussionTitle = 'Example topic 1';
    const feedbackText =
      'Test feedback for suspension verification ' + Date.now();

    // Credentials for standard user who will give feedback
    const { username } = getAuthUser('user1');

    // Set up network interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Login as standard user
    loginWithAuthUser('user1');

    // Navigate to a discussion
    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(discussionTitle).click();
    waitForGraphQL();

    // Create a comment that we'll give feedback on
    cy.get('[data-testid="comment-input"]').type(
      'Test comment for feedback suspension verification'
    );
    cy.get('[data-testid="submit-comment-button"]').click();
    waitForGraphQL();

    // Switch to moderator to give and report feedback
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    loginWithAuthUser('user2');

    // Navigate back to discussion
    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(discussionTitle).click();
    waitForGraphQL();

    // Find the comment by username_1 and give feedback
    cy.contains(username)
      .closest('[data-testid="comment"]')
      .find('[data-testid="comment-menu-button"]')
      .click();

    cy.get('[data-testid="comment-menu-button-item-Give Feedback"]').click();

    // Fill feedback form
    cy.contains('Give Feedback').should('be.visible');
    cy.get('[data-testid="report-comment-input"]').type(feedbackText);
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    // Make this user (username_1) give feedback to create content we'll suspend them for
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    loginWithAuthUser('user1');

    // Navigate back to discussion
    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(discussionTitle).click();
    waitForGraphQL();

    // Find feedback and report it back
    cy.get('[data-testid="feedback-tab"]').click();
    waitForGraphQL();

    // Give feedback on the feedback (this will be the content we suspend for)
    cy.contains(feedbackText)
      .closest('[data-testid="comment-feedback"]')
      .find('[data-testid="feedback-menu-button"]')
      .click();

    cy.get('[data-testid="feedback-menu-button-item-Give Feedback"]').click();

    // Fill nested feedback form
    cy.contains('Give Feedback').should('be.visible');
    cy.get('[data-testid="report-input"]').type('Nested feedback for testing');
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    // Switch back to moderator
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    loginWithAuthUser('user2');

    // Navigate back to discussion feedback
    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(discussionTitle).click();
    waitForGraphQL();

    cy.get('[data-testid="feedback-tab"]').click();
    waitForGraphQL();

    // Find the nested feedback and report with suspend
    cy.contains('Nested feedback for testing')
      .closest('[data-testid="feedback-feedback"]')
      .find('[data-testid="report-feedback-button"]')
      .click();

    // Complete report form with suspend
    cy.contains('Report Feedback').should('be.visible');
    cy.get('h3')
      .contains('Forum rules')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();
    cy.get('[data-testid="report-input"]').type(
      'Testing feedback suspension link verification'
    );

    // Select suspend and archive option
    cy.get('[data-testid="suspend-user-checkbox"]').check();
    cy.get('select').select('Two Weeks');

    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    // Navigate to suspended users
    cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
    waitForGraphQL();

    // Verify user was suspended
    cy.contains(username).should('be.visible');
    cy.contains('Suspended until').should('be.visible');

    // Find and click related issue link
    cy.contains('Related Issue').click();
    waitForGraphQL();

    // On issue page, unsuspend the user
    cy.contains('Unsuspend User').click();

    // Complete unsuspend form
    cy.contains('Unsuspend Author').should('be.visible');
    cy.get('[data-testid="report-discussion-input"]').type(
      'Unsuspending for test cleanup'
    );
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    // Verify unsuspend was successful
    cy.contains(/successfully|completed/i).should('be.visible');

    // Check suspended users page to verify user was unsuspended
    cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
    waitForGraphQL();

    // Verify user is no longer suspended
    cy.contains(username).should('not.exist');
    cy.contains('This forum has no suspended users').should('be.visible');
  });
});
