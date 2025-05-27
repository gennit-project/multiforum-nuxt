import { DateTime } from "luxon";
import { EVENT_CREATION_FORM, baseUrl } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Basic event operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser('loginWithCreateEventButton');

  it("creates, edits and deletes an online event with virtual event type", () => {
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

    // Set start date and time
    cy.get('input[data-testid="start-time-date-input"]').type(formatDate(startDateTime));
    cy.get('input[data-testid="start-time-time-input"]').type(formatTime(startDateTime));
    
    // Enable multi-day mode to make end date input visible
    cy.get('[data-testid="multi-day-input"]').click();
    
    // Now set end date and time
    cy.get('input[data-testid="end-time-date-input"]').type(formatDate(endDateTime));
    cy.get('input[data-testid="end-time-time-input"]').type(formatTime(endDateTime));
    
    // Select virtual event type from the dropdown
    cy.contains('div[data-testid="event-type-option"]', 'Virtual').click();
    
    // Verify the virtual URL field appears after selecting virtual event type
    cy.get('input[data-testid="link-input"]').should('be.visible');
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
      
    // Need to re-select the virtual event type since our UI now uses the selectedEventType ref
    cy.contains('div[data-testid="event-type-option"]', 'Virtual').click();
    
    // Now the link input should be visible
    cy.get('input[data-testid="link-input"]').should('be.visible');
    cy.get('input[data-testid="link-input"]').focus().clear();
    cy.get('input[data-testid="link-input"]').type(TEST_LINK_2);

    // Change the start date
    cy.get('input[data-testid="start-time-date-input"]').clear().type(formatDate(editedStartDateTime));

    // Change the start time
    cy.get('input[data-testid="start-time-time-input"]').clear().type(formatTime(editedStartDateTime));

    // Make sure multi-day mode is enabled to show end date picker
    cy.get('[data-testid="multi-day-input"]').click();
    
    // Change the end date
    cy.get('input[data-testid="end-time-date-input"]').clear().type(formatDate(editedEndDateTime));

    // Change the end time
    cy.get('input[data-testid="end-time-time-input"]').clear().type(formatTime(editedEndDateTime));

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

  it("supports hybrid event type selection", () => {
    // Helper function to format dates for input fields
    const formatDate = (dt) => dt.toFormat('yyyy-MM-dd');
    const formatTime = (dt) => dt.toFormat('HH:mm');  // Use 24-hour format for input fields
    
    // Generate future dates for testing
    const startDateTime = DateTime.now().plus({ months: 1, hours: 2 }).startOf('hour');
    const endDateTime = startDateTime.plus({ hours: 1 });
    
    const TEST_TITLE = "Hybrid Event Test";
    const TEST_LINK = "https://www.example.com/meeting";
    const TEST_CHANNEL = "phx_music";
    const TEST_LOCATION = "Phoenix Convention Center";

    // Intercept GraphQL requests
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('createEvent')) {
        req.alias = 'createEventRequest';
      }
    });
    
    // Test creating a hybrid event
    cy.visit(EVENT_CREATION_FORM);
    cy.get('input[data-testid="title-input"]').type(TEST_TITLE);

    cy.get('div[data-testid="channel-input"]')
      .type(`${TEST_CHANNEL}{enter}`);
    cy.get(`span[data-testid="forum-picker-${TEST_CHANNEL}"]`).click();
    // click outside to close the picker
    cy.get('input[data-testid="title-input"]').click();

    // Set start date and time
    cy.get('input[data-testid="start-time-date-input"]').type(formatDate(startDateTime));
    cy.get('input[data-testid="start-time-time-input"]').type(formatTime(startDateTime));
    
    // Enable multi-day mode to make end date input visible
    cy.get('[data-testid="multi-day-input"]').click();
    
    // Now set end date and time
    cy.get('input[data-testid="end-time-date-input"]').type(formatDate(endDateTime));
    cy.get('input[data-testid="end-time-time-input"]').type(formatTime(endDateTime));
    
    // Select hybrid event type from the dropdown
    cy.contains('div[data-testid="event-type-option"]', 'Hybrid').click();
    
    // Verify both virtual URL and location fields appear for hybrid events
    cy.get('input[data-testid="link-input"]').should('be.visible');
    cy.get('input[data-testid="link-input"]').type(TEST_LINK);
    
    cy.get('input[data-testid="location-search-input"]').should('be.visible');
    cy.get('input[data-testid="location-search-input"]').type(TEST_LOCATION);
    
    // Wait for the autocomplete dropdown to appear and select the first result
    cy.get('ul li').first().should('be.visible');
    cy.get('ul li').first().click();
    
    cy.get('textarea[data-testid="description-input"]').type("Hybrid event description");

    cy.get("button").contains("Save").click();
    cy.wait('@createEventRequest').its('response.statusCode').should('eq', 200);
    
    // Verify both virtual and physical location info is displayed
    cy.get("h2").contains(TEST_TITLE);
    cy.get("a").contains(TEST_LINK);
    cy.contains(TEST_LOCATION);
  });
});