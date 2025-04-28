import { ONLINE_EVENT_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Filter events by text", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("in the sitewide online events list, filters events by text", () => {
    const searchTerm = "virtual";

    cy.visit(ONLINE_EVENT_LIST).wait(1500);
    cy.get('input[data-testid="event-search-bar"]').type(`${searchTerm}{enter}`);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, filters events by text", () => {
    const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/events/`;
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW).wait(1500);

    cy.get('button[data-testid="toggle-main-filters-button"]').click();
    cy.get('button[data-testid="more-filters-button"]').click();
    cy.get('input[data-testid="event-search-bar"]').type(`${searchTerm}{enter}`);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });
});
