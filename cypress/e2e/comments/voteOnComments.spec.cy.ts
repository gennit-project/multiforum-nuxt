import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic root comment operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("can upvote comments", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);

    // Click on the first discussion
    cy.get("span").contains("Example topic 1").click();

    // Click the 'write a reply' textarea
    cy.get("textarea[data-testid='addComment']").click();

    // Type a comment
    cy.get("textarea[data-testid='texteditor-textarea']").type(TEST_COMMENT_TEXT);

    // Save the comment
    cy.get("button").contains("Save").click();

    // Check for paragraph with comment text
    cy.get('div[data-testid="comment"]').within(() => {
      cy.contains(TEST_COMMENT_TEXT);
      cy.get('button[data-testid="upvote-comment-button"]').contains("1");
    });
    // VOTING ON YOUR OWN COMMENT
    cy.get('div[data-testid="comment"]')
      .within(() => {
        cy.contains(TEST_COMMENT_TEXT)

        cy.get('button[data-testid="upvote-comment-button"]').click();
        cy.get('button[data-testid="upvote-comment-button"]').contains("0");

        // give the upvote back to yourself
        cy.get('button[data-testid="upvote-comment-button"]').click();
        cy.get('button[data-testid="upvote-comment-button"]').contains("1");
      });

    // VOTING ON SOMEONE ELSE'S COMMENT
    // Logging out and logging back in as a different user
    cy.get('button[data-testid="menu-button"]').click();
    cy.get('a[data-testid="sign-out-link"]').click();

    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");

    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    // Navigate to the discussion list and detail page
    cy.visit(DISCUSSION_LIST);
    cy.get("span").contains("Example topic 1").click();

    cy.get('div[data-testid="comment"]')
      .within(() => {
        cy.contains(TEST_COMMENT_TEXT)
        cy.get('button[data-testid="upvote-comment-button"]').click();
        cy.get('button[data-testid="upvote-comment-button"]').contains("2");

        cy.get('button[data-testid="upvote-comment-button"]').click();
        cy.get('button[data-testid="upvote-comment-button"]').contains("1");
      });
  });
});
