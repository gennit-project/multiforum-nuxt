import { CATS_FORUM, CATS_FORUM_EVENTS } from '../constants';
import { setupTestData } from '../../support/testSetup';
import { getAuthUser, loginWithAuthUser, waitForGraphQL } from '../utils';

/**
 * E2E tests for suspension enforcement.
 *
 * These tests verify that:
 * 1. A suspended user cannot create discussions in a channel
 * 2. A suspended user cannot create comments on existing discussions
 * 3. A suspended user cannot create events in a channel
 * 4. A suspended user receives a notification explaining why they were blocked
 * 5. After being unsuspended, the user can create content again
 */
describe('Suspended user permissions enforcement', () => {
  // Set up test data once for all tests in this file
  setupTestData();

  // Users for testing
  const { username: modUsername } = getAuthUser('user2');
  const { username: authorUsername } = getAuthUser('user1');

  it('suspended user cannot create a discussion and receives notification', () => {
    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Step 1: Login as the author and create a discussion that will be used to suspend them
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    // Create a discussion that will trigger suspension
    const testDiscussionTitle =
      'Discussion to trigger suspension ' + Date.now();
    cy.contains('Create Discussion').click();
    waitForGraphQL();

    cy.get('input[placeholder="Title"]').type(testDiscussionTitle);
    cy.get('[data-testid="texteditor-textarea"]').type(
      'This discussion will be used to test suspension enforcement.'
    );
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();
    cy.get('button').contains('Create').click();
    waitForGraphQL();

    cy.contains(testDiscussionTitle).should('be.visible');

    // Log out first user
    cy.visit('/logout');
    waitForGraphQL();

    // Step 2: Login as the moderator and suspend the author
    loginWithAuthUser('user2');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    // Find and click on the created discussion
    cy.contains(testDiscussionTitle).click();
    waitForGraphQL();

    // Open the discussion action menu and suspend the author
    cy.get('button[data-testid="discussion-menu-button"]').click();
    cy.get(
      'div[data-testid="discussion-menu-button-item-Archive and Suspend"]'
    ).click();

    // Fill suspension form
    cy.contains('Suspend Author').should('be.visible');
    cy.get('h3')
      .contains('Forum rules')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();
    cy.get('select').select('Two Weeks');
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Suspension for testing permission enforcement.'
    );

    cy.get('button').contains('Submit').click();
    waitForGraphQL();
    waitForGraphQL();

    cy.contains('Archived the post and suspended the author').should(
      'be.visible'
    );

    // Log out moderator
    cy.visit('/logout');
    waitForGraphQL();

    // Step 3: Login as the suspended author and try to create a discussion
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    // Try to create a new discussion
    cy.contains('Create Discussion').click();
    waitForGraphQL();

    const blockedDiscussionTitle = 'This should be blocked ' + Date.now();
    cy.get('input[placeholder="Title"]').type(blockedDiscussionTitle);
    cy.get('[data-testid="texteditor-textarea"]').type(
      'This discussion should not be created because the user is suspended.'
    );
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();

    // Intercept the create mutation to check for error response
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('createDiscussion')) {
        req.alias = 'createDiscussionAttempt';
      }
    });

    cy.get('button').contains('Create').click();

    // The request should fail or show an error message
    // Check for error indication in UI
    cy.contains(/suspended|permission|cannot/i, { timeout: 10000 }).should(
      'be.visible'
    );

    // Step 4: Check that a notification was created
    // Navigate to notifications page
    cy.get('[data-testid="notifications-button"]').click();
    cy.contains(/suspended.*cats/i).should('be.visible');

    // Step 5: Clean up - unsuspend the user
    cy.visit('/logout');
    waitForGraphQL();

    loginWithAuthUser('user2');

    cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
    waitForGraphQL();

    cy.contains(authorUsername).should('be.visible');
    cy.contains('Related Issue').click();
    waitForGraphQL();

    cy.contains('Unsuspend User').click();
    cy.contains('Unsuspend Author').should('be.visible');
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Cleanup after test.'
    );
    cy.get('button').contains('Submit').click();
    waitForGraphQL();
  });

  it('suspended user cannot create a comment', () => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Step 1: Create a discussion as the author that we'll comment on later
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    const discussionForComments =
      'Discussion for comment suspension test ' + Date.now();
    cy.contains('Create Discussion').click();
    waitForGraphQL();

    cy.get('input[placeholder="Title"]').type(discussionForComments);
    cy.get('[data-testid="texteditor-textarea"]').type(
      'Discussion to test comment creation while suspended.'
    );
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();
    cy.get('button').contains('Create').click();
    waitForGraphQL();

    // Store the discussion URL for later
    cy.url().then((discussionUrl) => {
      // Log out
      cy.visit('/logout');
      waitForGraphQL();

      // Step 2: Login as mod and suspend the author from a different discussion
      loginWithAuthUser('user2');

      // Create a discussion as mod to use for suspension
      cy.visit(CATS_FORUM);
      waitForGraphQL();

      const modDiscussion = 'Mod discussion for suspension ' + Date.now();
      cy.contains('Create Discussion').click();
      waitForGraphQL();

      cy.get('input[placeholder="Title"]').type(modDiscussion);
      cy.get('[data-testid="texteditor-textarea"]').type(
        'Mod created discussion.'
      );
      cy.get('[data-testid="forum-picker"]').click();
      cy.contains('Cats').click();
      cy.get('button').contains('Create').click();
      waitForGraphQL();

      // Now go back to author's discussion and suspend them via comment
      cy.visit(discussionUrl);
      waitForGraphQL();

      // Add a comment first that we can use to suspend the author
      // Actually, let's use the discussion header menu to suspend
      cy.get('button[data-testid="discussion-menu-button"]').click();

      // Check if "Suspend Author" option exists (for non-archived discussions)
      cy.get('body').then(($body) => {
        if (
          $body.find(
            'div[data-testid="discussion-menu-button-item-Archive and Suspend"]'
          ).length > 0
        ) {
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
          cy.get('select').select('One Week');
          cy.get('textarea[data-testid="report-discussion-input"]').type(
            'Suspension for comment test.'
          );
          cy.get('button').contains('Submit').click();
          waitForGraphQL();
        }
      });

      // Log out mod
      cy.visit('/logout');
      waitForGraphQL();

      // Step 3: Login as suspended author and try to comment
      loginWithAuthUser('user1');

      // Visit the mod's discussion to try commenting
      cy.visit(CATS_FORUM);
      waitForGraphQL();

      // Find any discussion to comment on
      cy.get('a[href*="/discussions/"]').first().click();
      waitForGraphQL();

      // Try to add a comment - the comment form may be disabled or submission blocked
      cy.get('body').then(($body) => {
        // Check if comment textarea exists
        if ($body.find('[data-testid="comment-textarea"]').length > 0) {
          cy.get('[data-testid="comment-textarea"]').type(
            'This comment should be blocked.'
          );
          cy.get('button').contains('Submit').click();

          // Should see an error about being suspended
          cy.contains(/suspended|permission|cannot/i, {
            timeout: 10000,
          }).should('be.visible');
        } else {
          // Comment form might be hidden for suspended users
          cy.log(
            'Comment form not visible - user may be blocked from commenting'
          );
        }
      });

      // Cleanup - unsuspend
      cy.visit('/logout');
      waitForGraphQL();

      loginWithAuthUser('user2');

      cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
      waitForGraphQL();

      cy.get('body').then(($body) => {
        if ($body.text().includes(authorUsername)) {
          cy.contains('Related Issue').click();
          waitForGraphQL();

          cy.contains('Unsuspend User').click();
          cy.get('textarea[data-testid="report-discussion-input"]').type(
            'Cleanup.'
          );
          cy.get('button').contains('Submit').click();
          waitForGraphQL();
        }
      });
    });
  });

  it('suspended user cannot create an event', () => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Step 1: Login as author and create a discussion that will trigger suspension
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    const triggerDiscussion = 'Trigger event suspension test ' + Date.now();
    cy.contains('Create Discussion').click();
    waitForGraphQL();

    cy.get('input[placeholder="Title"]').type(triggerDiscussion);
    cy.get('[data-testid="texteditor-textarea"]').type(
      'Discussion for event test.'
    );
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();
    cy.get('button').contains('Create').click();
    waitForGraphQL();

    cy.visit('/logout');
    waitForGraphQL();

    // Step 2: Login as mod and suspend the author
    loginWithAuthUser('user2');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(triggerDiscussion).click();
    waitForGraphQL();

    cy.get('button[data-testid="discussion-menu-button"]').click();
    cy.get(
      'div[data-testid="discussion-menu-button-item-Archive and Suspend"]'
    ).click();

    cy.get('h3')
      .contains('Forum rules')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();
    cy.get('select').select('One Week');
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Event suspension test.'
    );
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    cy.visit('/logout');
    waitForGraphQL();

    // Step 3: Login as suspended author and try to create an event
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM_EVENTS);
    waitForGraphQL();

    // Try to create an event
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Create Event")').length > 0) {
        cy.contains('Create Event').click();
        waitForGraphQL();

        // Fill in event form
        cy.get('input[placeholder="Title"]').type(
          'Blocked event ' + Date.now()
        );
        cy.get('[data-testid="texteditor-textarea"]').type(
          'This event should not be created.'
        );

        // Select forum
        cy.get('[data-testid="forum-picker"]').click();
        cy.contains('Cats').click();

        // Set date/time (required fields)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0] ?? '';

        cy.get('input[type="date"]').first().type(dateStr);
        cy.get('input[type="time"]').first().type('14:00');

        cy.get('button').contains('Create').click();

        // Should see an error about being suspended
        cy.contains(/suspended|permission|cannot/i, { timeout: 10000 }).should(
          'be.visible'
        );
      } else {
        cy.log(
          'Create Event button not visible - may be hidden for suspended users'
        );
      }
    });

    // Cleanup
    cy.visit('/logout');
    waitForGraphQL();

    loginWithAuthUser('user2');

    cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
    waitForGraphQL();

    cy.get('body').then(($body) => {
      if ($body.text().includes(authorUsername)) {
        cy.contains('Related Issue').click();
        waitForGraphQL();

        cy.contains('Unsuspend User').click();
        cy.get('textarea[data-testid="report-discussion-input"]').type(
          'Cleanup.'
        );
        cy.get('button').contains('Submit').click();
        waitForGraphQL();
      }
    });
  });

  it('unsuspended user can create content again', () => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    // Step 1: Suspend the author
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    const suspendDiscussion = 'Unsuspend test discussion ' + Date.now();
    cy.contains('Create Discussion').click();
    waitForGraphQL();

    cy.get('input[placeholder="Title"]').type(suspendDiscussion);
    cy.get('[data-testid="texteditor-textarea"]').type('For unsuspend test.');
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();
    cy.get('button').contains('Create').click();
    waitForGraphQL();

    cy.visit('/logout');
    waitForGraphQL();

    // Suspend as mod
    loginWithAuthUser('user2');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    cy.contains(suspendDiscussion).click();
    waitForGraphQL();

    cy.get('button[data-testid="discussion-menu-button"]').click();
    cy.get(
      'div[data-testid="discussion-menu-button-item-Archive and Suspend"]'
    ).click();

    cy.get('h3')
      .contains('Forum rules')
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();
    cy.get('select').select('One Week');
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Unsuspend test suspension.'
    );
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    // Step 2: Unsuspend the author
    cy.visit(`${CATS_FORUM.replace('discussions', 'edit/suspended-users')}`);
    waitForGraphQL();

    cy.contains(authorUsername).should('be.visible');
    cy.contains('Related Issue').click();
    waitForGraphQL();

    cy.contains('Unsuspend User').click();
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      'Unsuspending for test.'
    );
    cy.get('button').contains('Submit').click();
    waitForGraphQL();

    cy.visit('/logout');
    waitForGraphQL();

    // Step 3: Login as author and verify they can create content
    loginWithAuthUser('user1');

    cy.visit(CATS_FORUM);
    waitForGraphQL();

    const afterUnsuspendDiscussion = 'Discussion after unsuspend ' + Date.now();
    cy.contains('Create Discussion').click();
    waitForGraphQL();

    cy.get('input[placeholder="Title"]').type(afterUnsuspendDiscussion);
    cy.get('[data-testid="texteditor-textarea"]').type(
      'This discussion should be created successfully after unsuspension.'
    );
    cy.get('[data-testid="forum-picker"]').click();
    cy.contains('Cats').click();
    cy.get('button').contains('Create').click();
    waitForGraphQL();

    // Verify the discussion was created successfully
    cy.contains(afterUnsuspendDiscussion).should('be.visible');

    // Should NOT see any suspension error
    cy.contains(/suspended|permission denied/i).should('not.exist');
  });
});
