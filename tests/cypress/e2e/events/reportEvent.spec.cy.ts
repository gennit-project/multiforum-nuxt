import { CATS_FORUM_EVENTS, CHANNEL_ISSUES } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Report event", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can report an event successfully", () => {
    const targetEventTitle = "Test free/virtual event";
    // Use username_2 to ensure we're not the author of the event (created by username_1)
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as the second user who is not the author of the event
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

    // Click on the Report option - use first() to handle duplicate data-testid
    cy.get('[data-testid="event-menu-button-item-Report"]').first().should("be.visible").click();

    // Check for the report modal title
    cy.contains("Report Event").should("be.visible");

    // Select a forum rule
    cy.get("h3").contains("Forum rules").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();

    // Add explanation text
    cy.get('textarea[data-testid="report-event-input"]')
      .should("be.visible")
      .type("This is a test report for integration testing purposes.");

    // Click the Submit Report button
    cy.contains("button", "Submit").click();

    // Wait for the submission to complete
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify success notification appears
    cy.contains("Your report was submitted successfully").should("be.visible");

    // Verify the success notification appears
    cy.contains("Your report was submitted successfully").should("be.visible");

    // Now navigate to the channel's open issues tab
    cy.visit(`${CHANNEL_ISSUES}`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify that the issue appears in the list of open issues
    cy.get('[data-testid="issue-list"]').contains(targetEventTitle).should("be.visible");
  });
});
