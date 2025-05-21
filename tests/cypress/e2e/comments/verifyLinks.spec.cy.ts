import { CATS_FORUM, DISCUSSION_LIST } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Comment moderation link verification", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser("loginWithCreateEventButton");

  it("verifies navigation links between archived comment, issue, and original context", () => {
    // Test data
    const discussionTitle = "Example topic 1";
    const commentText = "Test comment for link verification " + Date.now();

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Step 1: Navigate to discussion and create a test comment
    cy.visit(DISCUSSION_LIST);
    cy.wait("@graphqlRequest");

    cy.get("span").contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Create a new comment
    cy.get("textarea[data-testid='addComment']", { timeout: 10000 }).should("be.visible").click();
    cy.get("textarea[data-testid='texteditor-textarea']").should("be.visible").type(commentText);
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest");

    // Verify comment was created
    cy.contains(commentText).should("be.visible");

    // Step 2: Archive the comment
    // Find the specific comment and open its menu
    cy.get('div[data-testid="comment"]')
      .contains(commentText)
      .closest('div[data-testid="comment"]')
      .within(() => {
        cy.get('button[data-testid="commentMenu"]').click();
      });

    // Select archive option
    cy.get(".v-list-item").contains("Archive").click();

    // Complete archive form
    cy.contains("Archive Comment").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
    cy.get("textarea").type("Testing link verification");
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

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Navigate to discussion and create a test comment
    cy.visit(DISCUSSION_LIST);
    cy.wait("@graphqlRequest");

    cy.get("span").contains(discussionTitle).click();
    cy.wait("@graphqlRequest");

    // Create a new comment
    cy.get("textarea[data-testid='addComment']", { timeout: 10000 }).should("be.visible").click();
    cy.get("textarea[data-testid='texteditor-textarea']").should("be.visible").type(commentText);
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest");

    // Verify comment was created
    cy.contains(commentText).should("be.visible");

    // Find the comment and open the menu
    cy.get('div[data-testid="comment"]')
      .contains(commentText)
      .closest('div[data-testid="comment"]')
      .within(() => {
        cy.get('button[data-testid="commentMenu"]').click();
      });

    // Select give feedback option
    cy.get(".v-list-item").contains("Give Feedback").click();

    // Fill in the feedback form
    cy.contains("Give Feedback").should("be.visible");
    cy.get("textarea").type(feedbackText);
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest");

    // Verify feedback submitted
    cy.contains("Feedback submitted successfully").should("be.visible");

    // Find and report the feedback (to create an issue)
    cy.contains(feedbackText)
      .closest('div[data-testid="commentFeedback"]')
      .within(() => {
        cy.get('button[data-testid="feedbackMenu"]').click();
      });

    cy.get(".v-list-item").contains("Report").click();

    // Complete report form
    cy.contains("Report Feedback").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
    cy.get("textarea").type("Testing feedback link verification");
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
