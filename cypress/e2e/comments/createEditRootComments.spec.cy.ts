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
    cy.get("textarea[data-testid='addComment']", { timeout: 10000 }).should('be.visible').click();

    // Type a comment
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT
    );

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    cy.get("p").contains(TEST_COMMENT_TEXT);

    // Now edit the comment
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT)
      .within(() => {
        // Look for the EllipsisHorizontal icon which is inside the MenuButton
        cy.get('button[data-testid="commentMenu"').should("be.visible").click();
      });

    cy.get(".v-list-item").contains("div", "Edit").should("be.visible").click();

    // Type a new comment
    const updatedCommentText = "This is my updated comment";
    cy.get("textarea[data-testid='texteditor-textarea']")
      .clear()
      .type(updatedCommentText);

    // Save the comment
    cy.get("span").contains("Save").click();
    // Check for paragraph with comment text
    cy.get("p").contains(updatedCommentText);

    // Now delete the comment
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", updatedCommentText)
      .within(() => {
        // Look for the EllipsisHorizontal icon which is inside the MenuButton
        cy.get('button[data-testid="commentMenu"').should("be.visible").click();
      });

    cy.get(".v-list-item")
      .contains("div", "Delete")
      .should("be.visible")
      .click();

    // Confirm deletion
    cy.get("button").contains("Delete").click();

    // Check that the comment is gone
    cy.get("p").contains(updatedCommentText).should("not.exist");
  });
});
