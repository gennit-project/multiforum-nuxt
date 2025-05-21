import { IN_PERSON_EVENT_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Filter events by distance", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  beforeEach(() => {
    // Intercept GraphQL requests
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("events")) {
        req.alias = "getEventsRequest";
      } else if (req.body.query?.includes("event(")) {
        req.alias = "getEventDetailsRequest";
      }
    });
  });

  it("in the sitewide in-person events list, filters events by distance", () => {
    // Go to the map view.
    cy.visit(IN_PERSON_EVENT_LIST);
    // Wait for initial events data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // Open the "More Filters" drawer.
    cy.get('button[data-testid="more-filters-button"]').click();

    // Wait for the popper content to be visible and ready
    cy.get(".popper").should("be.visible");

    // Make sure the distance button is visible and ready before clicking
    cy.get('button[data-testid="distance-8.04672"]')
      .should("be.visible")
      .should("not.be.disabled")
      .click({ force: true });

    // Wait for filtered events to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // Click the "More Filters" button to close the popover.
    cy.get('button[data-testid="more-filters-button"]').click();

    // Should have three result, all in Yucca Tap Room,
    // which is within 5 miles of Tempe, AZ, the default location.
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 3);

    // Make sure each list item says "Yucca Tap Room."
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .each(($el) => {
        cy.wrap($el).contains("Yucca Tap Room");
      });

    // Open the "More Filters" drawer.
    cy.get('button[data-testid="more-filters-button"]').click();

    // Wait for the popper content to be visible and ready
    cy.get(".popper").should("be.visible");

    // Click the "Any Distance" button.
    cy.get('button[data-testid="distance-0"]')
      .should("be.visible")
      .should("not.be.disabled")
      .click({ force: true });

    // Click the "More Filters" button to close the popover.
    cy.get('button[data-testid="more-filters-button"]').click();

    // There should be 12 results (all in-person events in the test data).
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 12);

    // Click "Selena Night" in the list
    cy.get('ul[data-testid="event-list"]').find("span").contains("Selena Night").click();

    // Confirm that the preview drawer opens and it has Selena Night
    cy.get('div[data-testid="event-preview"]');
    // there is an H2 with the event title
    cy.get("h2").contains("Selena Night");
  });
});
