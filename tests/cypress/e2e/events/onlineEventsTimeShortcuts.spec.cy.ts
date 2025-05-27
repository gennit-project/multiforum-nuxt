import { setupTestData } from "../../support/testSetup";
import { ONLINE_EVENT_LIST } from "../constants";

describe("Filter events by time period", () => {
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
  
  it("should filter events by time period correctly", () => {
    cy.visit(ONLINE_EVENT_LIST);
    // Wait for initial data to load
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);

    // wait for event list to load before testing filters
    cy.get('ul[data-testid="event-list"]').should("exist");

    // Test today's events
    cy.get(`span[data-testid=time-shortcut-Today]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("Today").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("Tomorrow").should("not.exist");

    // Test tomorrow's events
    cy.get(`span[data-testid=time-shortcut-Tomorrow]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("Tomorrow").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("Today").should("not.exist");

    // Test this weekend's events
    cy.get(`span[data-testid="time-shortcut-This weekend"]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Weekend").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next Weekend").should("not.exist");

    // Test next week's events
    cy.get(`span[data-testid="time-shortcut-Next week"]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next Week").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Weekend").should("not.exist");

    // Test next weekend's events
    cy.get(`span[data-testid="time-shortcut-Next weekend"]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next Weekend").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Weekend").should("not.exist");

    // Test this month's events
    cy.get(`span[data-testid="time-shortcut-This month"]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Month").should("exist");

    // Test past events
    cy.get(`span[data-testid="time-shortcut-Past events"]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("Past").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Month").should("not.exist");

    // Test next month's events
    cy.get(`span[data-testid="time-shortcut-Next month"]`).should('be.visible').click();
    cy.wait('@getEventsRequest').its('response.statusCode').should('eq', 200);
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next Month").should("exist");
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Month").should("not.exist");
  });
});