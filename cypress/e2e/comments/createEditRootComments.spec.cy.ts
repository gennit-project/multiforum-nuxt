import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic root comment operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("creates, edits and deletes a comment", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);

    // Click on the first discussion
    cy.get("span").contains("Example topic 1").click();

    // Click the 'write a reply' textarea
    cy.get("textarea[data-testid='addComment']").click();

    // Type a comment
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT,
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT);

    // Now edit the comment
    cy.contains('[data-testid="comment"]', TEST_COMMENT_TEXT)
      // Find the button where the id is commentMenu
      .find('[id="commentMenu"]')
      .click();

    cy.get("div").contains("Edit").click();

    // Type a new comment
    const updatedCommentText = "This is my updated comment";
    cy.get("textarea[data-testid='texteditor-textarea']")
      .clear()
      .type(updatedCommentText);

    // Save the comment
    cy.get("span").contains("Save").click();
    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT);

    // Now delete the comment
    cy.contains('[data-testid="comment"]', updatedCommentText)
      .find('[id="commentMenu"]')
      .click();

    cy.get("div").contains("Delete").click();

    // Confirm deletion
    cy.get("button").contains("Delete").click();

    // Check that the comment is gone
    cy.get("p").contains(updatedCommentText).should("not.exist");
  });
});
