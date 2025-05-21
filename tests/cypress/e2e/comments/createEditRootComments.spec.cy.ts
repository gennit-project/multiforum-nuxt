import { DISCUSSION_LIST } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Basic root comment operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser("loginWithCreateEventButton");

  it("creates, edits and deletes a comment", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // Set up GraphQL request interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Intercept specific GraphQL operations
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("createComments")) {
        req.alias = "createCommentRequest";
      } else if (req.body.query?.includes("updateComments")) {
        req.alias = "updateCommentRequest";
      } else if (req.body.query?.includes("deleteComments")) {
        req.alias = "deleteCommentRequest";
      }
    });

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Click on the first discussion
    cy.get("span").contains("Example topic 1").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Click the 'write a reply' textarea
    cy.get("textarea[data-testid='addComment']", { timeout: 10000 }).should("be.visible").click();

    // Type a comment
    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .type(TEST_COMMENT_TEXT);

    // Save the comment
    cy.get("button").contains("Save").click();
    cy.wait("@createCommentRequest").its("response.statusCode").should("eq", 200);

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT).should("be.visible");

    // Now edit the comment
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT)
      .within(() => {
        // Look for the comment menu button
        cy.get('button[data-testid="commentMenu"]').should("be.visible").click();
      });

    cy.get(".v-list-item").contains("div", "Edit").should("be.visible").click();

    // Type a new comment
    const updatedCommentText = "This is my updated comment";
    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .clear()
      .type(updatedCommentText);

    // Save the comment
    cy.get("span").contains("Save").click();
    cy.wait("@updateCommentRequest").its("response.statusCode").should("eq", 200);

    // Check for paragraph with updated comment text
    cy.get("p").contains(updatedCommentText).should("be.visible");

    // Now delete the comment
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", updatedCommentText)
      .within(() => {
        // Look for the comment menu button
        cy.get('button[data-testid="commentMenu"]').should("be.visible").click();
      });

    cy.get(".v-list-item").contains("div", "Delete").should("be.visible").click();

    // Confirm deletion
    cy.get("button").contains("Delete").click();
    cy.wait("@deleteCommentRequest").its("response.statusCode").should("eq", 200);

    // Check that the comment is gone
    cy.get("p").contains(updatedCommentText).should("not.exist");
  });
});
