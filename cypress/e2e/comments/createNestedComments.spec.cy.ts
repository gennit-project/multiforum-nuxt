import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic root comment operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("creates, edits and deletes a comment", () => {
    const TEST_COMMENT_TEXT_1 = "Test comment 1";

    // CREATE ROOT COMMENT

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);

    // Click on the first discussion
    cy.get("span").contains("Example topic 1").click();

    // Click the 'write a reply' textarea
    cy.get("textarea[data-testid='addComment']").click();

    // Type a comment
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT_1,
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_1);

    // CREATE CHILD COMMENTS, ALSO CALLED SECOND LEVEL COMMENTS

    // Reply to that comment
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_1)
      .find('div[data-testid="reply-comment-button"]')
      .click();

    // Type a first reply to the root comment
    const TEST_COMMENT_TEXT_2 = "Test comment 2";
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT_2,
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_2);

    // Type a second reply to the root comment
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT_1)
      .find('div[data-testid="reply-comment-button"]')
      .click();
    const TEST_COMMENT_TEXT_3 = "Test comment 3";
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT_3,
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // CREATE THIRD LEVEL COMMENTS

    // Write a reply to the reply
    cy.contains("[data-testid='comment']", TEST_COMMENT_TEXT_3)
      .find('div[data-testid="reply-comment-button"]')
      .click();

    // Type a first reply to the second-level comment
    const TEST_COMMENT_TEXT_4 = "Test comment 4";
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT_4,
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT_4);

    // Type a second reply to the second-level comment
    const TEST_COMMENT_TEXT_5 = "Test comment 5";

    cy.contains("[data-testid='comment']", TEST_COMMENT_TEXT_3)
      .find('div[data-testid="reply-comment-button"]')
      .click();
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT_5,
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    // Write a third-level comment (a reply to the second-level comment)

    cy.get("p").contains(TEST_COMMENT_TEXT_5);
  });
});
