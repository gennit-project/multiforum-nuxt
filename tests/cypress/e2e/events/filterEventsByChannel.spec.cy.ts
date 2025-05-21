import { ONLINE_EVENT_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Filter events by channel", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  beforeEach(() => {
    // Intercept GraphQL requests
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("events")) {
        req.alias = "getEventsRequest";
      }
    });
  });

  it("filters events by channel", () => {
    const searchTerm = "Test free/virtual event";

    cy.visit(ONLINE_EVENT_LIST);
    // Wait for initial events data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="forum-filter-button"]')
      .should("be.visible")
      .first() // Get the first button in case there are multiple buttons with the same data-testid
      .click();

    cy.get('span[data-testid="forum-picker-cats"]').should("be.visible").first().click();

    // Wait for filtered events to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST);
    // Wait for initial events data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // open the channel picker
    cy.get('button[data-testid="forum-filter-button"]')
      .should("be.visible")
      .first() // Get the first button in case there are multiple buttons with the same data-testid
      .click();

    // click the cats tag
    cy.get('span[data-testid="forum-picker-cats"]').should("be.visible").first().click();

    // Wait for first filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // click the phx_music tag
    cy.get('span[data-testid="forum-picker-phx_music"]').should("be.visible").first().click();

    // Wait for second filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // should have ten results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 10);
  });
});
