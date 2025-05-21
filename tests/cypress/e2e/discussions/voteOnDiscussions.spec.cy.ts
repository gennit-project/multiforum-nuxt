import { DISCUSSION_CREATION_FORM, CATS_FORUM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Basic discussion operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can upvote and downvote discussions", () => {
    // User 2 logs in
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    const TEST_DISCUSSION = "Test discussion voting";
    const TEST_CHANNEL = "cats";

    // Test creating a discussion.
    cy.visit(DISCUSSION_CREATION_FORM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Add title
    cy.get('input[data-testid="title-input"]').type(TEST_DISCUSSION);

    // Add channel
    cy.get('div[data-testid="channel-input"]').type(`${TEST_CHANNEL}{enter}`);
    cy.get(`span[data-testid="forum-picker-${TEST_CHANNEL}"]`).click();

    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    cy.get("h2").contains(TEST_DISCUSSION);

    // Test that after creating a discussion, it should have one upvote.
    cy.get('button[data-testid="upvote-discussion-button"]').contains("1");

    // VOTING ON YOUR OWN DISCUSSION

    // Wait for authentication to fully complete
    // Intercept the upvote mutation specifically
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("upvoteDiscussion") || req.body.query?.includes("Upvote")) {
        req.alias = "upvoteMutation";
      }
    });

    // Wait for the button to be fully hydrated and interactive
    // Check for the data-auth-state attribute to ensure RequireAuth component is fully rendered
    cy.get('[data-auth-state="authenticated"]')
      .should("exist")
      .find('button[data-testid="upvote-discussion-button"]')
      .should("be.visible")
      .should("not.be.disabled")
      .should("have.attr", "data-testid", "upvote-discussion-button");

    // Add additional delay to ensure hydration is complete
    cy.wait(1000);

    // If you click that upvote button, it should have zero upvotes.
    cy.get('button[data-testid="upvote-discussion-button"]').click({ force: true });
    cy.wait("@upvoteMutation", { timeout: 10000 }).its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="upvote-discussion-button"]').should("be.visible").contains("0");
  });

  it("User 2 can upvote another user's discussion", () => {
    // User 2 logs in
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    // Intercept the upvote mutation specifically
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("upvoteDiscussion") || req.body.query?.includes("Upvote")) {
        req.alias = "upvoteMutation";
      }
    });

    // VOTING ON SOMEONE ELSE'S DISCUSSION
    // Go to the cats forum
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Use "Example topic 1," which comes from the test data and
    // is authored by cluse.
    cy.get("a").contains("Example topic 1").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Wait for the button to be fully hydrated and interactive
    cy.get('[data-auth-state="authenticated"]')
      .should("exist")
      .find('button[data-testid="upvote-discussion-button"]')
      .should("be.visible")
      .should("not.be.disabled")
      .should("have.attr", "data-testid", "upvote-discussion-button");

    // Add additional delay to ensure hydration is complete
    cy.wait(1000);

    // In the test data, that discussion starts with one vote.
    cy.get('button[data-testid="upvote-discussion-button"]').should("be.visible").contains("1");

    // Click the upvote button and it should go to two votes.
    cy.get('button[data-testid="upvote-discussion-button"]').click({ force: true });
    cy.wait("@upvoteMutation", { timeout: 10000 }).its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="upvote-discussion-button"]').should("be.visible").contains("2");

    // Click the upvote button a second time and it should go
    // back to one vote.
    cy.get('button[data-testid="upvote-discussion-button"]').should("be.visible").click();
    cy.wait("@upvoteMutation", { timeout: 10000 }).its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="upvote-discussion-button"]').should("be.visible").contains("1");
  });
});
