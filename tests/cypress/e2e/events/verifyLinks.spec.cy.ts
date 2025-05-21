import { CATS_FORUM_EVENTS, EVENT_CREATION_FORM } from "../constants";
import { setupTestData } from "../../support/testSetup";
import { DateTime } from "luxon";

describe("Event moderation link verification", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("verifies navigation links between archived event, issue, and original context", () => {
    // Format dates for event creation
    const formatDate = (dt) => dt.toFormat("yyyy-MM-dd");
    const formatTime = (dt) => dt.toFormat("HH:mm");

    // Generate future date for the event
    const startDateTime = DateTime.now().plus({ months: 1, hours: 2 }).startOf("hour");
    const endDateTime = startDateTime.plus({ hours: 1 });

    // Test data
    const eventTitle = "Test event for link verification " + Date.now();

    // Credentials
    const username = Cypress.env("auth0_username_1");
    const password = Cypress.env("auth0_password_1");
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as regular user to create event
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Create a test event
    cy.visit(EVENT_CREATION_FORM);
    cy.wait("@graphqlRequest");

    // Fill in event form
    cy.get('[data-testid="title-input"]').type(eventTitle);
    cy.get('[data-testid="channel-input"]').type("cats{enter}");
    cy.get('[data-testid="forum-picker-cats"]').click();

    // Set the date/time
    cy.get('[data-testid="start-time-date-input"]').type(formatDate(startDateTime));
    cy.get('[data-testid="start-time-time-input"]').type(formatTime(startDateTime));
    cy.get('[data-testid="multi-day-input"]').click();
    cy.get('[data-testid="end-time-date-input"]').type(formatDate(endDateTime));
    cy.get('[data-testid="end-time-time-input"]').type(formatTime(endDateTime));

    // Select virtual event type
    cy.contains('[data-testid="event-type-option"]', "Virtual").click();
    cy.get('[data-testid="link-input"]').type("https://example.com/meeting");

    // Add description
    cy.get('[data-testid="description-input"]').type("This is a test event for verifying links.");

    // Save event
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest");

    // Verify event was created
    cy.contains(eventTitle).should("be.visible");

    // Store the event URL
    cy.url().then((originalEventUrl) => {
      // Switch to moderator account
      cy.get('[data-testid="logout-button"]').click();
      cy.wait(2000);

      cy.loginWithCreateEventButton({
        username: modUsername,
        password: modPassword,
      });

      // Navigate to the event
      cy.visit(originalEventUrl);
      cy.wait("@graphqlRequest");

      // Open the action menu
      cy.get('[data-testid="event-menu-button"]').click();

      // Select archive option
      cy.get('[data-testid="event-menu-button-item-Archive"]').click();

      // Complete archive form
      cy.contains("Archive Event").should("be.visible");
      cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
      cy.get('[data-testid="report-event-input"]').type("Testing event link verification");
      cy.get("button").contains("Submit").click();
      cy.wait("@graphqlRequest");

      // Verify archived banner appears with link
      cy.get('[data-testid="archived-event-banner"]').should("be.visible");
      cy.get('[data-testid="archived-event-banner"]')
        .contains("View related issue")
        .should("be.visible");

      // Click link to issue
      cy.get('[data-testid="archived-event-banner"]').contains("View related issue").click();
      cy.wait("@graphqlRequest");

      // Verify we're on the issue page
      cy.contains("Issue Details").should("be.visible");

      // Store issue URL
      cy.url().then((issueUrl) => {
        // Find link back to original event
        cy.get("#original-post-container").contains(eventTitle).click();
        cy.wait("@graphqlRequest");

        // Verify we returned to the original event
        cy.url().should("eq", originalEventUrl);
        cy.get('[data-testid="archived-event-banner"]').should("be.visible");

        // Return to issue
        cy.visit(issueUrl);
        cy.wait("@graphqlRequest");

        // Unarchive from issue
        cy.contains("Unarchive").click();
        cy.contains("Unarchive Event").should("be.visible");
        cy.get("textarea").type("Unarchiving for test cleanup");
        cy.get("button").contains("Unarchive").click();
        cy.wait("@graphqlRequest");

        // Navigate back to event
        cy.get("#original-post-container").contains(eventTitle).click();
        cy.wait("@graphqlRequest");

        // Verify event is no longer archived
        cy.get('[data-testid="archived-event-banner"]').should("not.exist");
      });
    });
  });

  it("verifies links between reported event feedback, issue, and original event", () => {
    // Format dates for event creation
    const formatDate = (dt) => dt.toFormat("yyyy-MM-dd");
    const formatTime = (dt) => dt.toFormat("HH:mm");

    // Generate future date for the event
    const startDateTime = DateTime.now().plus({ months: 1, hours: 2 }).startOf("hour");
    const endDateTime = startDateTime.plus({ hours: 1 });

    // Test data
    const eventTitle = "Test event for feedback verification " + Date.now();
    const feedbackText = "Test feedback for event link verification";

    // Credentials
    const username = Cypress.env("auth0_username_1");
    const password = Cypress.env("auth0_password_1");
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Set up network interception
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as regular user to create event
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Create a test event
    cy.visit(EVENT_CREATION_FORM);
    cy.wait("@graphqlRequest");

    // Fill in event form
    cy.get('[data-testid="title-input"]').type(eventTitle);
    cy.get('[data-testid="channel-input"]').type("cats{enter}");
    cy.get('[data-testid="forum-picker-cats"]').click();

    // Set the date/time
    cy.get('[data-testid="start-time-date-input"]').type(formatDate(startDateTime));
    cy.get('[data-testid="start-time-time-input"]').type(formatTime(startDateTime));
    cy.get('[data-testid="multi-day-input"]').click();
    cy.get('[data-testid="end-time-date-input"]').type(formatDate(endDateTime));
    cy.get('[data-testid="end-time-time-input"]').type(formatTime(endDateTime));

    // Select virtual event type
    cy.contains('[data-testid="event-type-option"]', "Virtual").click();
    cy.get('[data-testid="link-input"]').type("https://example.com/meeting");

    // Add description
    cy.get('[data-testid="description-input"]').type(
      "This is a test event for feedback link verification."
    );

    // Save event
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest");

    // Verify event was created
    cy.contains(eventTitle).should("be.visible");

    // Store the event URL
    cy.url().then((originalEventUrl) => {
      // Switch to moderator account
      cy.get('[data-testid="logout-button"]').click();
      cy.wait(2000);

      cy.loginWithCreateEventButton({
        username: modUsername,
        password: modPassword,
      });

      // Navigate to the event
      cy.visit(originalEventUrl);
      cy.wait("@graphqlRequest");

      // Open the action menu
      cy.get('[data-testid="event-menu-button"]').click();

      // Select give feedback option
      cy.get('[data-testid="event-menu-button-item-Give Feedback"]').click();

      // Fill in feedback form
      cy.contains("Give Feedback").should("be.visible");
      cy.get('[data-testid="report-event-input"]').type(feedbackText);
      cy.get("button").contains("Submit").click();
      cy.wait("@graphqlRequest");

      // Verify feedback submitted successfully
      cy.contains("Feedback submitted successfully").should("be.visible");

      // Navigate to feedback tab
      cy.get('[data-testid="feedback-tab"]').click();
      cy.wait("@graphqlRequest");

      // Report the feedback
      cy.contains(feedbackText)
        .closest('[data-testid="event-feedback"]')
        .find('[data-testid="report-feedback-button"]')
        .click();

      // Complete report form
      cy.contains("Report Feedback").should("be.visible");
      cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();
      cy.get('[data-testid="report-input"]').type("Testing event feedback link verification");
      cy.get("button").contains("Submit").click();
      cy.wait("@graphqlRequest");

      // Navigate to issues page
      cy.visit(`${CATS_FORUM_EVENTS.replace("events", "issues")}`);
      cy.wait("@graphqlRequest");

      // Find and click on the issue for our feedback
      cy.contains("Feedback on event").click();
      cy.wait("@graphqlRequest");

      // Store issue URL
      cy.url().then((issueUrl) => {
        // Verify we can navigate from issue to original feedback
        cy.get("#original-post-container").contains("View original feedback").click();
        cy.wait("@graphqlRequest");

        // Verify we're on the feedback permalink page
        cy.contains(feedbackText).should("be.visible");

        // Verify we can get back to the original event
        cy.contains("View in event").click();
        cy.wait("@graphqlRequest");

        // Verify we're back at the original event
        cy.url().should("include", originalEventUrl.split("?")[0]);
        cy.contains(eventTitle).should("be.visible");

        // Clean up: Go back to issue and archive the feedback
        cy.visit(issueUrl);
        cy.wait("@graphqlRequest");

        cy.contains("Archive").click();
        cy.contains("Archive Feedback").should("be.visible");
        cy.get("textarea").type("Archiving for test cleanup");
        cy.get("button").contains("Archive").click();
        cy.wait("@graphqlRequest");

        // Verify archive was successful
        cy.contains("Content archived successfully").should("be.visible");
      });
    });
  });
});
