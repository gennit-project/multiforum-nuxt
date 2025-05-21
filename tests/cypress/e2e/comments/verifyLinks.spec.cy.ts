import { CATS_FORUM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Comment moderation link verification", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("verifies navigation links between archived comment, issue, and original context", () => {
    // Test data
    const discussionTitle = "Example topic 1";
    const commentText = "Test comment for link verification " + Date.now();

    // Moderator credentials
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as moderator
    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    // Step 1: Navigate to discussion and create a test comment
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Create a new comment
    cy.get('[data-testid="comment-input"]').type(commentText);
    cy.get('[data-testid="submit-comment-button"]').click();
    cy.wait("@graphqlRequest");

    // Verify comment was created
    cy.contains(commentText).should("be.visible");

    // Step 2: Archive the comment
    // Find the specific comment and open its menu
    cy.contains(commentText)
      .closest('[data-testid="comment"]')
      .find('[data-testid="comment-menu-button"]')
      .click();

    // Select archive option
    cy.get('[data-testid="comment-menu-button-item-Archive"]').click();

    // Complete archive form
    cy.contains("Archive Comment").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
    cy.get('[data-testid="report-comment-input"]').type("Testing link verification");
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Step 3: Verify archived comment placeholder appears with link
    cy.contains("This comment has been archived").should("be.visible");
    cy.contains("View related issue").should("be.visible");

    // Step 4: Store the current URL (discussion context)
    cy.url().then((discussionUrl) => {
      // Click link to issue
      cy.contains("View related issue").click();
      cy.wait("@graphqlRequest");

      // Verify we're on the issue page
      cy.contains("Issue Details").should("be.visible");

      // Step 5: Store issue URL
      cy.url().then((issueUrl) => {
        // Find link back to original comment context
        cy.get("#original-post-container").contains("View original comment").click();
        cy.wait("@graphqlRequest");

        // Step 6: Verify we returned to the original discussion context
        cy.url().should("include", discussionUrl.split("#")[0]); // Compare base URL without hash
        cy.contains("This comment has been archived").should("be.visible");

        // Step 7: Return to issue for cleanup
        cy.visit(issueUrl);
        cy.wait("@graphqlRequest");

        // Step 8: Unarchive from issue
        cy.contains("Unarchive").click();
        cy.contains("Unarchive Comment").should("be.visible");
        cy.get("textarea").type("Unarchiving for test cleanup");
        cy.get("button").contains("Unarchive").click();
        cy.wait("@graphqlRequest");

        // Step 9: Follow link back to original context
        cy.get("#original-post-container").contains("View original comment").click();
        cy.wait("@graphqlRequest");

        // Step 10: Verify comment is no longer archived
        cy.contains(commentText).should("be.visible");
        cy.contains("This comment has been archived").should("not.exist");
      });
    });
  });

  it("verifies links between reported comment feedback, issue, and original comment", () => {
    // Test data
    const discussionTitle = "Example topic 1";
    const commentText = "Test comment for feedback link verification " + Date.now();
    const feedbackText = "Test feedback for link verification";

    // Credentials
    const username = Cypress.env("auth0_username_1");
    const password = Cypress.env("auth0_password_1");
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as normal user
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Navigate to discussion and create a test comment
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Create a new comment
    cy.get('[data-testid="comment-input"]').type(commentText);
    cy.get('[data-testid="submit-comment-button"]').click();
    cy.wait("@graphqlRequest");

    // Verify comment was created
    cy.contains(commentText).should("be.visible");

    // Switch to moderator account to give feedback
    cy.get('[data-testid="logout-button"]').click();
    cy.wait(2000);

    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    // Navigate back to the discussion
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest");

    cy.contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Find the comment and open the menu
    cy.contains(commentText)
      .closest('[data-testid="comment"]')
      .find('[data-testid="comment-menu-button"]')
      .click();

    // Select give feedback option
    cy.get('[data-testid="comment-menu-button-item-Give Feedback"]').click();

    // Fill in the feedback form
    cy.contains("Give Feedback").should("be.visible");
    cy.get('textarea[data-testid="report-comment-input"]').type(feedbackText);
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Verify feedback submitted
    cy.contains("Feedback submitted successfully").should("be.visible");

    // Report the feedback (to create an issue)
    cy.contains(feedbackText)
      .closest('[data-testid="comment-feedback"]')
      .find('[data-testid="report-feedback-button"]')
      .click();

    // Complete report form
    cy.contains("Report Feedback").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
    cy.get('textarea[data-testid="report-input"]').type("Testing feedback link verification");
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Navigate to issues page
    cy.visit(`${CATS_FORUM.replace("discussions", "issues")}`);
    cy.wait("@graphqlRequest");

    // Find and click on the issue for our feedback
    cy.contains("Feedback on comment").click();
    cy.wait("@graphqlRequest");

    // Store issue URL
    cy.url().then((issueUrl) => {
      // Verify we can navigate from issue to original feedback
      cy.get("#original-post-container").contains("View original feedback").click();
      cy.wait("@graphqlRequest");

      // Verify we're on the feedback permalink page
      cy.contains(feedbackText).should("be.visible");

      // Verify we can get back to the original comment context
      cy.contains("View in discussion").click();
      cy.wait("@graphqlRequest");

      // Verify we're back at the original comment
      cy.contains(commentText).should("be.visible");

      // Clean up: Go back to issue and archive the feedback
      cy.visit(issueUrl);
      cy.wait("@graphqlRequest");

      cy.contains("Archive").click();
      cy.contains("Archive Feedback").should("be.visible");
      cy.get("textarea").type("Archiving for test cleanup");
      cy.get("button").contains("Archive").click();
      cy.wait("@graphqlRequest");

      // Verify archive was successful
      cy.contains("Content archived successfully").should("be.visible");
    });
  });
});
