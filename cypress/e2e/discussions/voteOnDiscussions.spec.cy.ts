import { DISCUSSION_CREATION_FORM } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic discussion operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("can upvote and downvote discussions", () => {
    const TEST_DISCUSSION = "Test discussion voting";
    const TEST_CHANNEL = "cats";

    // Test creating a discussion.
    cy.visit(DISCUSSION_CREATION_FORM);

    // Add title
    cy.get('input[data-testid="title-input"]').type(TEST_DISCUSSION);

    // Add channel
    cy.get('input[data-testid="channel-input"]').type(`${TEST_CHANNEL}{enter}`);

    cy.get("button").contains("Save").click().wait(1000);
    cy.get("h2").contains(TEST_DISCUSSION);

    // Test that after creating a discussion, it should have one upvote.
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");

    // VOTING ON YOUR OWN DISCUSSION

    // If you click that upvote button, it should have zero upvotes.
    cy.get('button[data-testid="upvote-discussion-button"]').click();
    cy.get('button[data-testid="upvote-discussion-button"]').contains("0");

     // Click the downvote button.
     cy.get('button[data-testid="downvote-discussion-button"]').click();

     // The first time you downvote, it asks to create a mod profile. Click yes.
     cy.get("button").contains("Yes").click();

    // Confirm that the downvote button now says "1."
    cy.get('button[data-testid="downvote-discussion-button"]').contains("1");

    // Click the downvote button again.
    cy.get('button[data-testid="downvote-discussion-button"]').click();

    // Confirm that the downvote button now says "0."
    cy.get('button[data-testid="downvote-discussion-button"]').contains("0");


    // VOTING ON SOMEONE ELSE'S DISCUSSION

    // Click the back link to go to the channel discussion list, where
    // we can find a discussion made by someone else.
    cy.get('a[data-testid="discussion-detail-back-link"]').click();

    // Click the discussion link to go to the discussion preview.
    // Use "Example topic 1," which comes from the test data and 
    // is authored by cluse.
    cy.get("a").contains("Example topic 1").click();

    // In the test data, that discussion starts with one vote.
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");

    // Click the upvote button and it should go to two votes.
    cy.get('button[data-testid="upvote-discussion-button"]').click();
    cy.get('button[data-testid="upvote-discussion-button"]').contains("2");

    // Click the upvote button a second time and it should go
    // back to one vote.
    cy.get('button[data-testid="upvote-discussion-button"]').click();
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");


    // Click the downvote button.
    cy.get('button[data-testid="downvote-discussion-button"]').click();

    // Confirm that the downvote button now says "1."
    cy.get('button[data-testid="downvote-discussion-button"]').contains("1");

    // Click the downvote button again.
    cy.get('button[data-testid="downvote-discussion-button"]').click();

    // Confirm that the downvote button now says "0."
    cy.get('button[data-testid="downvote-discussion-button"]').contains("0");
    
  });
});
