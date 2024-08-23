import { EVENT_CREATION_FORM } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic event operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("creates, edits and deletes an online event", () => {
    const TEST_TITLE = "Tempe Event Title";
    const TEST_LINK = "www.test.com";
    const TEST_LINK_2 = "www.test2.com";

    // Test creating an online event
    cy.visit(EVENT_CREATION_FORM);
    cy.get('input[data-testid="title-input"]').type(TEST_TITLE);

    cy.get('input[data-testid="channel-input"]').type("phx_music{enter}");

    cy.get('input[data-testid="start-time-date-input"]').type("2023-12-01");
    cy.get('input[data-testid="start-time-time-input"]').type("08:30");
    cy.get('input[data-testid="end-time-date-input"]').type("2023-12-01");
    cy.get('input[data-testid="end-time-time-input"]').type("09:30");

    cy.get('input[data-testid="link-input"]').type(TEST_LINK);

    cy.get('textarea[data-testid="description-input"]').type(
      "Test description",
    );

    cy.get("button").contains("Save").click();
    cy.get("h2").contains(TEST_TITLE);
    cy.get("a").contains(TEST_LINK);

    // Test editing an event
    cy.get("button").contains("Edit").click();

    // Change the link
    cy.get('input[data-testid="link-input"]').focus().clear();
    cy.get('input[data-testid="link-input"]').type(TEST_LINK_2);

    // Change the start date
    cy.get('input[data-testid="start-time-date-input"]').type("2023-12-02");

    // Change the start time
    cy.get('input[data-testid="start-time-time-input"]').type("08:45");

    // Change the end date
    cy.get('input[data-testid="end-time-date-input"]').type("2023-12-02");

    // Change the end time
    cy.get('input[data-testid="end-time-time-input"]').type("09:45");

    cy.get("button").contains("Save").click();

    // Check that the event has been updated
    cy.get("a").contains(TEST_LINK_2);
    cy.get("span").contains("December 2 2023");
    cy.get("span").contains("8:45");

    // Test canceling an event
    cy.get('div[data-testid="event-menu-button').find("button").click();
    // Click on the edit button
    cy.get("div").contains("Cancel").click();
    cy.get("button").contains("Yes").click();
    cy.get("p[data-testid='canceled-event-banner']").should("exist");

    // Test deleting an event
    cy.get('div[data-testid="event-menu-button').find("button").click();

    cy.get("div").contains("Delete").click();
    cy.get("button").contains("Delete").click();
    // After deletion, the user should be redirected to the online event list
    // for the channel view
    cy.url().should("include", "events/search");
  });
});
