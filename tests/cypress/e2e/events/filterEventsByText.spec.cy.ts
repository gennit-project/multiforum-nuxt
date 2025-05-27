import { ONLINE_EVENT_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Filter events by text", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  
  beforeEach(() => {
    // Intercept GraphQL requests
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('events')) {
        req.alias = 'getEventsRequest';
      }
    });
  });

  it("in the sitewide online events list, filters events by text", () => {
    const searchTerm = "virtual";

    cy.visit(ONLINE_EVENT_LIST);
    // Wait for initial data to load
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    
    cy.get('input[data-testid="event-search-bar"]')
      .should('be.visible')
      .type(`${searchTerm}{enter}`);
    
    // Wait for filtered events to load
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, filters events by text", () => {
    const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/events/`;
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW);
    // Wait for initial data to load
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);

    cy.get('button[data-testid="toggle-main-filters-button"]').click();
    cy.get('button[data-testid="more-filters-button"]').should('be.visible').click();
    
    // Wait for popper to be visible
    cy.get('.popper').should('be.visible');

    cy.get('input[data-testid="event-search-bar"]')
      .should('be.visible')
      .type(`${searchTerm}{enter}`);
    
    // Wait for filtered events to load
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });
});
