import { DISCUSSION_LIST } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Basic nested comment operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser("loginWithCreateEventButton");

  it("creates nested comments at multiple levels", () => {
    const TEST_COMMENT_TEXT_1 = "Test comment 1";

    // Set up GraphQL request interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Intercept specific GraphQL operations
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("createComments")) {
        req.alias = "createCommentRequest";
      } else if (req.body.query?.includes("getComments")) {
        req.alias = "getCommentsRequest";
      }
    });

    // CREATE ROOT COMMENT

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
      .type(TEST_COMMENT_TEXT_1);

    // Save the comment
    cy.get("button").contains("Save").click();
    cy.wait("@createCommentRequest").its("response.statusCode").should("eq", 200);

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_1).should("be.visible");

    // CREATE CHILD COMMENTS (SECOND LEVEL COMMENTS)

    // Reply to that comment
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_1)
      .should("be.visible")
      .find('div[data-testid="reply-comment-button"]')
      .should("be.visible")
      .click();

    // Type a first reply to the root comment
    const TEST_COMMENT_TEXT_2 = "Test comment 2";
    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .type(TEST_COMMENT_TEXT_2);

    // Save the comment
    cy.get("button").contains("Save").click();
    cy.wait("@createCommentRequest").its("response.statusCode").should("eq", 200);

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_2).should("be.visible");

    // Type a second reply to the root comment
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_1)
      .should("be.visible")
      .find('div[data-testid="reply-comment-button"]')
      .should("be.visible")
      .click();

    const TEST_COMMENT_TEXT_3 = "Test comment 3";
    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .type(TEST_COMMENT_TEXT_3);

    // Save the comment
    cy.get("button").contains("Save").click();
    cy.wait("@createCommentRequest").its("response.statusCode").should("eq", 200);

    // Wait for comment to appear
    cy.get("p").contains(TEST_COMMENT_TEXT_3).should("be.visible");

    // CREATE THIRD LEVEL COMMENTS

    // Write a reply to the reply
    cy.contains("[data-testid='comment']", TEST_COMMENT_TEXT_3)
      .should("be.visible")
      .find('div[data-testid="reply-comment-button"]')
      .should("be.visible")
      .click();

    // Type a first reply to the second-level comment
    const TEST_COMMENT_TEXT_4 = "Test comment 4";
    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .type(TEST_COMMENT_TEXT_4);

    // Save the comment
    cy.get("button").contains("Save").click();
    cy.wait("@createCommentRequest").its("response.statusCode").should("eq", 200);

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_4).should("be.visible");

    // Type a second reply to the second-level comment
    const TEST_COMMENT_TEXT_5 = "Test comment 5";

    cy.contains("[data-testid='comment']", TEST_COMMENT_TEXT_3)
      .should("be.visible")
      .find('div[data-testid="reply-comment-button"]')
      .should("be.visible")
      .click();

    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .type(TEST_COMMENT_TEXT_5);

    // Save the comment
    cy.get("button").contains("Save").click();
    cy.wait("@createCommentRequest").its("response.statusCode").should("eq", 200);

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_5).should("be.visible");

    // Verify the entire comment hierarchy is visible
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_1).should("be.visible");
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_2).should("be.visible");
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_3).should("be.visible");
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_4).should("be.visible");
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_5).should("be.visible");
  });
});
