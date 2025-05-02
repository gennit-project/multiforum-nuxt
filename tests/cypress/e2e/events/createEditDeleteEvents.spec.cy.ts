import { DateTime } from "luxon";
import { EVENT_CREATION_FORM, baseUrl } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Basic event operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser('loginWithCreateEventButton');

  it("creates, edits and deletes an online event", () => {
    // Helper function to format dates for input fields
    const formatDate = (dt) => dt.toFormat('yyyy-MM-dd');
    const formatTime = (dt) => dt.toFormat('HH:mm');  // Use 24-hour format for input fields
    const formatDisplayTime = (dt) => dt.toFormat('h:mm');  // 12-hour format for assertions

    // Generate future dates for testing
    const startDateTime = DateTime.now().plus({ months: 1, hours: 2 }).startOf('hour');
    const endDateTime = startDateTime.plus({ hours: 1 });
    const editedStartDateTime = startDateTime.plus({ days: 1, minutes: 15 });
    const editedEndDateTime = editedStartDateTime.plus({ hours: 1 });

    const TEST_TITLE = "Tempe Event Title";
    const TEST_LINK = "https://www.test.com";
    const TEST_LINK_2 = "https://www.test2.com";
    const TEST_CHANNEL = "phx_music"

    // Intercept GraphQL requests
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('createEvent')) {
        req.alias = 'createEventRequest';
      } else if (req.body.query?.includes('updateEvent')) {
        req.alias = 'updateEventRequest';
      } else if (req.body.query?.includes('deleteEvent')) {
        req.alias = 'deleteEventRequest';
      }
    });
    
    // Test creating an online event
    cy.visit(EVENT_CREATION_FORM);
    cy.get('input[data-testid="title-input"]').type(TEST_TITLE);

    cy.get('div[data-testid="channel-input"]')
      .type(`${TEST_CHANNEL}{enter}`);
    cy.get(`span[data-testid="forum-picker-${TEST_CHANNEL}"]`).click();
    // click outside to close the picker
    cy.get('input[data-testid="title-input"]').click();

    cy.get('input[data-testid="start-time-date-input"]').type(formatDate(startDateTime));
    cy.get('input[data-testid="start-time-time-input"]').type(formatTime(startDateTime));
    cy.get('input[data-testid="end-time-date-input"]').type(formatDate(endDateTime));
    cy.get('input[data-testid="end-time-time-input"]').type(formatTime(endDateTime));

    cy.get('input[data-testid="link-input"]').type(TEST_LINK);

    cy.get('textarea[data-testid="description-input"]').type(
      "Test description",
    );

    cy.get("button").contains("Save").click();
    cy.wait('@createEventRequest').its('response.statusCode').should('eq', 200);
    cy.get("h2").contains(TEST_TITLE);
    cy.get("a").contains(TEST_LINK);

    // Test editing an event
    cy.get('button[data-testid="event-menu-button')
      .click();
    // Click on the edit button
    cy.get("div[data-testid=event-menu-button-item-Edit]")
      // click the first one
      .first()
      .click();

    // Change the link
    cy.get('input[data-testid="link-input"]').focus().clear();
    cy.get('input[data-testid="link-input"]').type(TEST_LINK_2);

    // Change the start date
    cy.get('input[data-testid="start-time-date-input"]').type(formatDate(editedStartDateTime));

    // Change the start time
    cy.get('input[data-testid="start-time-time-input"]').type(formatTime(editedStartDateTime));

    // Change the end date
    cy.get('input[data-testid="end-time-date-input"]').type(formatDate(editedEndDateTime));

    // Change the end time
    cy.get('input[data-testid="end-time-time-input"]').type(formatTime(editedEndDateTime));

    cy.get("button").contains("Save").click();
    cy.wait('@updateEventRequest').its('response.statusCode').should('eq', 200);

    // Check that the event has been updated
    cy.get("a").contains(TEST_LINK_2);
    // Update the assertions to check for the month and time in 12-hour format
    cy.get("span").contains(editedStartDateTime.toFormat('MMMM d yyyy'));
    cy.get("span").contains(formatDisplayTime(editedStartDateTime));

    // Test canceling an event
    cy.get('button[data-testid="event-menu-button')
      .click();
    // Click on the edit button
    cy.get("div").contains("Cancel").click();
    cy.get("button").contains("Yes").click();
    cy.get("div[data-testid='canceled-event-banner']").should("exist");

    // Test deleting an event
    cy.get('button[data-testid="event-menu-button')
      .click();

    cy.get("div").contains("Delete").click();
    cy.get("button").contains("Delete").click();
    cy.wait('@deleteEventRequest').its('response.statusCode').should('eq', 200);
    
    // After deletion, the user should be redirected to the online event list
    // for the channel view
    cy.url().should("equal", `${baseUrl}/forums/${TEST_CHANNEL}/events`);
  });
});