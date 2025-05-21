import { CATS_FORUM_EVENTS, CHANNEL_ISSUES } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Archive and unarchive event", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can archive an event, see the archived banner, and verify the issue appears in closed issues", () => {
    const targetEventTitle = "Test free/virtual event";
    // Use username_2 to ensure we're not the author of the event (created by username_1)
    // Username_2 should be an elevated mod with archive permissions
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as the second user who is a moderator
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Visit the forum's events tab and open the target event
    cy.visit(CATS_FORUM_EVENTS);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Wait for list to be visible and click the event
    cy.get('ul[data-testid="event-list"]').should("be.visible");
    cy.get("span").contains(targetEventTitle).click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Now interact with elements on the event detail page
    cy.url().should("include", "/events/");

    // Open the event action menu
    cy.get('button[data-testid="event-menu-button"]').should("be.visible").click();

    // Click on the Archive option
    cy.get('div[data-testid="event-menu-button-item-Archive"]').should("be.visible").click();

    // Check for the modal title
    cy.contains("Archive Event").should("be.visible");

    // Select a forum rule
    cy.get("h3").contains("Forum rules").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();

    // Add archive reason text
    cy.get('textarea[data-testid="report-event-input"]').type(
      "This is a test archive for a rule violation"
    );

    // Submit the archive
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the success notification appears
    cy.contains("The event was reported and archived successfully").should("be.visible");

    // Verify that the archived banner appears on the event
    cy.get('[data-testid="archived-event-banner"]').should("be.visible");
    cy.get('[data-testid="archived-event-banner"]')
      .contains("This event is archived")
      .should("be.visible");

    // Now navigate to the channel's closed issues tab
    cy.visit(`${CHANNEL_ISSUES}/closed`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify that the issue appears in the list of closed issues
    cy.get('[data-testid="issue-list"]').contains(targetEventTitle).should("be.visible");

    // Visit the forum's events tab again
    cy.visit(`${CATS_FORUM_EVENTS}`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Archived event is no longer visible in the open events list
    cy.contains(targetEventTitle).should("not.exist");
  });

  it("can unarchive an event and verify the archived banner disappears", () => {
    const targetEventTitle = "Test free/virtual event";
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as the moderator
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Navigate to the closed issues tab to find the archived event
    cy.visit(`${CHANNEL_ISSUES}/closed`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // First click on the issue to navigate to the issue detail page
    cy.get('[data-testid="issue-list"]').contains(targetEventTitle).click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Now on the issue detail page, find the specific link in the original-post-container
    cy.get("#original-post-container")
      .contains(targetEventTitle)
      .closest("a") // Get the link containing the event title
      .click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the archived banner is visible
    cy.get('[data-testid="archived-event-banner"]').should("be.visible");

    // Now interact with elements on the event detail page
    cy.url().should("include", "/events/");

    // Open the event action menu
    cy.get('button[data-testid="event-menu-button"]').should("be.visible").click();

    // Click on the Unarchive option
    cy.get('div[data-testid="event-menu-button-item-Unarchive"]').click();

    // Check for the unarchive modal
    cy.contains("Unarchive Event").should("be.visible");

    // Add unarchive reason text
    cy.get("textarea").type("This is a test unarchive");

    // Submit the unarchive
    cy.get("button").contains("Unarchive").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the success notification appears
    cy.contains("The event was unarchived successfully.").should("be.visible");

    // Verify that the archived banner no longer appears
    cy.get('[data-testid="archived-event-banner"]').should("not.exist");

    // Visit the forum's events tab again
    cy.visit(`${CATS_FORUM_EVENTS}`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Wait for event list to be visible
    cy.get('ul[data-testid="event-list"]').should("be.visible");

    // Verify that the unarchived event is now visible in the events list
    cy.contains(targetEventTitle).should("be.visible");
  });
});
