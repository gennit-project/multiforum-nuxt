import { DISCUSSION_CREATION_FORM, CATS_FORUM } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic discussion operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
  });

  it("can upvote and downvote discussions", () => {
    // User 2 logs in
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");
    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });
    const TEST_DISCUSSION = "Test discussion voting";
    const TEST_CHANNEL = "cats";

    // Test creating a discussion.
    cy.visit(DISCUSSION_CREATION_FORM).wait(3000);

    // Add title
    cy.get('input[data-testid="title-input"]').type(TEST_DISCUSSION);

    // Add channel
    cy.get('div[data-testid="channel-input"]').type(`${TEST_CHANNEL}{enter}`);
    cy.get(`span[data-testid="forum-picker-${TEST_CHANNEL}"]`).click();

    cy.get("button").contains("Save").click().wait(3000);
    cy.get("h2").contains(TEST_DISCUSSION);

    // Test that after creating a discussion, it should have one upvote.
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");

    // VOTING ON YOUR OWN DISCUSSION

    // If you click that upvote button, it should have zero upvotes.
    cy.get('button[data-testid="upvote-discussion-button"]').click();
    cy.get('button[data-testid="upvote-discussion-button"]').contains("0");
  });

  it("User 2 can upvote another user's discussion", () => {
    // User 2 logs in
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");
    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    // VOTING ON SOMEONE ELSE'S DISCUSSION
    // Go to the cats forum
    cy.visit(CATS_FORUM).wait(3000);
    
    // Use "Example topic 1," which comes from the test data and
    // is authored by cluse.
    cy.get("a").contains("Example topic 1").click().wait(3000);

    // In the test data, that discussion starts with one vote.
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");

    // Click the upvote button and it should go to two votes.
    cy.get('button[data-testid="upvote-discussion-button"]').click().wait(3000);
    cy.get('button[data-testid="upvote-discussion-button"]').contains("2");

    // Click the upvote button a second time and it should go
    // back to one vote.
    cy.get('button[data-testid="upvote-discussion-button"]').click().wait(3000);
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");
  });
});
