import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic comment operations", () => {
  before(() => {
    deleteAll();
    seedAll();
  });

  it("User 1 can upvote their own comment", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // User 1 logs in
    cy.loginWithCreateEventButton();

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);

    // Click on the first discussion
    cy.get("span").contains("Example topic 1").click();

    // Add a comment
    cy.get("textarea[data-testid='addComment']", { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.get("textarea[data-testid='texteditor-textarea']").type(
      TEST_COMMENT_TEXT
    );
    cy.get("button").contains("Save").click();

    // Verify the comment and upvote it
    cy.get('div[data-testid="comment"]').within(() => {
      cy.contains(TEST_COMMENT_TEXT);
      cy.get('button[data-testid="upvote-comment-button"]').contains("1");

      // Toggle upvote
      cy.get('button[data-testid="upvote-comment-button"]').click();
      cy.get('button[data-testid="upvote-comment-button"]').contains("0");

      // Give the upvote back
      cy.get('button[data-testid="upvote-comment-button"]').click();
      cy.get('button[data-testid="upvote-comment-button"]').contains("1");
    });
  });

  it("User 2 can upvote another user's comment", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // User 2 logs in
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");
    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);

    // Navigate to the same discussion
    cy.get("span").contains("Example topic 1").click();

    // Upvote the comment as User 2
    cy.get('div[data-testid="comment"]').within(() => {
      cy.contains(TEST_COMMENT_TEXT);

      // Select the button in the authenticated state
      cy.get(
        '[data-auth-state="authenticated"] button[data-testid="upvote-comment-button"]',
        { timeout: 10000 }
      )
        .should("exist")
        .click()
        // there should be 2 upvotes now
        .contains("2");

      // Select the button in the unauthenticated state
      cy.get(
        '[data-auth-state="authenticated"] button[data-testid="upvote-comment-button"]'
      )
        .should("exist")
        .click()
        // there should be 1 upvote now
        .contains("1");
    });
  });
});
