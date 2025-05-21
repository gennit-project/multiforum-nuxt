import { CATS_FORUM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Feedback moderation link verification", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("verifies links between discussion feedback, issue, and original content", () => {
    // Test data
    const discussionTitle = "Example topic 1";
    const feedbackText = "Test standalone feedback for link verification " + Date.now();

    // Credentials
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as moderator
    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    // Navigate to a discussion
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Open action menu and give feedback
    cy.get('[data-testid="discussion-menu-button"]').click();
    cy.get('[data-testid="discussion-menu-button-item-Give Feedback"]').click();

    // Fill feedback form
    cy.contains("Give Feedback").should("be.visible");
    cy.get('[data-testid="report-discussion-input"]').type(feedbackText);
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Verify feedback submitted
    cy.contains("Feedback submitted successfully").should("be.visible");

    // Go to feedback tab
    cy.get('[data-testid="feedback-tab"]').click();
    cy.wait("@graphqlRequest");

    // Store URL of discussion with feedback
    cy.url().then((discussionWithFeedbackUrl) => {
      // Report the feedback
      cy.contains(feedbackText)
        .closest('[data-testid="discussion-feedback"]')
        .find('[data-testid="report-feedback-button"]')
        .click();

      // Complete report form
      cy.contains("Report Feedback").should("be.visible");
      cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
      cy.get('[data-testid="report-input"]').type("Testing feedback link verification");
      cy.get("button").contains("Submit").click();
      cy.wait("@graphqlRequest");

      // Verify report success
      cy.contains("Content reported successfully").should("be.visible");

      // Navigate to issues
      cy.visit(`${CATS_FORUM.replace("discussions", "issues")}`);
      cy.wait("@graphqlRequest");

      // Find and open issue for feedback
      cy.contains("Feedback on discussion").click();
      cy.wait("@graphqlRequest");

      // Store issue URL
      cy.url().then((issueUrl) => {
        // Verify link from issue to feedback permalink
        cy.get("#original-post-container").contains("View original feedback").click();
        cy.wait("@graphqlRequest");

        // Store feedback permalink URL
        cy.url().then((feedbackPermalinkUrl) => {
          // Verify we're looking at the feedback
          cy.contains(feedbackText).should("be.visible");

          // Check link back to discussion
          cy.contains("View in discussion").click();
          cy.wait("@graphqlRequest");

          // Verify we can go from feedback permalink to discussion
          cy.url().should("include", discussionWithFeedbackUrl.split("?")[0]);

          // Go back to issue to test archive flow
          cy.visit(issueUrl);
          cy.wait("@graphqlRequest");

          // Archive the feedback
          cy.contains("Archive").click();
          cy.contains("Archive Feedback").should("be.visible");
          cy.get("textarea").type("Archiving feedback for test");
          cy.get("button").contains("Archive").click();
          cy.wait("@graphqlRequest");

          // Verify archive success
          cy.contains("Content archived successfully").should("be.visible");

          // Go to permalink to verify archived state
          cy.visit(feedbackPermalinkUrl);
          cy.wait("@graphqlRequest");

          // Verify feedback shows as archived
          cy.contains("This feedback has been archived").should("be.visible");
          cy.contains("View related issue").should("be.visible");

          // Follow link back to issue
          cy.contains("View related issue").click();
          cy.wait("@graphqlRequest");

          // Verify we're back at issue
          cy.url().should("eq", issueUrl);

          // Unarchive the feedback
          cy.contains("Unarchive").click();
          cy.contains("Unarchive Feedback").should("be.visible");
          cy.get("textarea").type("Unarchiving for test cleanup");
          cy.get("button").contains("Unarchive").click();
          cy.wait("@graphqlRequest");

          // Go back to permalink to verify unarchived state
          cy.visit(feedbackPermalinkUrl);
          cy.wait("@graphqlRequest");

          // Verify feedback no longer shows as archived
          cy.contains("This feedback has been archived").should("not.exist");
          cy.contains(feedbackText).should("be.visible");
        });
      });
    });
  });

  it("verifies suspending and unsuspending user from feedback context", () => {
    // Test data
    const discussionTitle = "Example topic 1";
    const feedbackText = "Test feedback for suspension verification " + Date.now();

    // Credentials for standard user who will give feedback
    const username = Cypress.env("auth0_username_1");
    const password = Cypress.env("auth0_password_1");
    // Credentials for mod who will suspend
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as standard user
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Navigate to a discussion
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Create a comment that we'll give feedback on
    cy.get('[data-testid="comment-input"]').type(
      "Test comment for feedback suspension verification"
    );
    cy.get('[data-testid="submit-comment-button"]').click();
    cy.wait("@graphqlRequest");

    // Switch to moderator to give and report feedback
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    // Navigate back to discussion
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Find the comment by username_1 and give feedback
    cy.contains(username)
      .closest('[data-testid="comment"]')
      .find('[data-testid="comment-menu-button"]')
      .click();

    cy.get('[data-testid="comment-menu-button-item-Give Feedback"]').click();

    // Fill feedback form
    cy.contains("Give Feedback").should("be.visible");
    cy.get('[data-testid="report-comment-input"]').type(feedbackText);
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Make this user (username_1) give feedback to create content we'll suspend them for
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Navigate back to discussion
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Find feedback and report it back
    cy.get('[data-testid="feedback-tab"]').click();
    cy.wait("@graphqlRequest");

    // Give feedback on the feedback (this will be the content we suspend for)
    cy.contains(feedbackText)
      .closest('[data-testid="comment-feedback"]')
      .find('[data-testid="feedback-menu-button"]')
      .click();

    cy.get('[data-testid="feedback-menu-button-item-Give Feedback"]').click();

    // Fill nested feedback form
    cy.contains("Give Feedback").should("be.visible");
    cy.get('[data-testid="report-input"]').type("Nested feedback for testing");
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Switch back to moderator
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    // Navigate back to discussion feedback
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    cy.get('[data-testid="feedback-tab"]').click();
    cy.wait("@graphqlRequest");

    // Find the nested feedback and report with suspend
    cy.contains("Nested feedback for testing")
      .closest('[data-testid="feedback-feedback"]')
      .find('[data-testid="report-feedback-button"]')
      .click();

    // Complete report form with suspend
    cy.contains("Report Feedback").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
    cy.get('[data-testid="report-input"]').type("Testing feedback suspension link verification");

    // Select suspend and archive option
    cy.get('[data-testid="suspend-user-checkbox"]').check();
    cy.get("select").select("Two Weeks");

    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Navigate to suspended users
    cy.visit(`${CATS_FORUM.replace("discussions", "edit/suspended-users")}`);
    cy.wait("@graphqlRequest");

    // Verify user was suspended
    cy.contains(username).should("be.visible");
    cy.contains("Suspended until").should("be.visible");

    // Find and click related issue link
    cy.contains("Related Issue").click();
    cy.wait("@graphqlRequest");

    // On issue page, unsuspend the user
    cy.contains("Unsuspend User").click();

    // Complete unsuspend form
    cy.contains("Unsuspend Author").should("be.visible");
    cy.get('[data-testid="report-discussion-input"]').type("Unsuspending for test cleanup");
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Verify unsuspend was successful
    cy.contains(/successfully|completed/i).should("be.visible");

    // Check suspended users page to verify user was unsuspended
    cy.visit(`${CATS_FORUM.replace("discussions", "edit/suspended-users")}`);
    cy.wait("@graphqlRequest");

    // Verify user is no longer suspended
    cy.contains(username).should("not.exist");
    cy.contains("This forum has no suspended users").should("be.visible");
  });
});
