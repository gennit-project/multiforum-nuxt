import { DISCUSSION_LIST } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Filter discussions by text", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser('loginWithCreateEventButton');

  it("in the sitewide online discussions list, filters discussions by text", () => {
    const searchTerm = "topic 1";

    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    cy.visit(DISCUSSION_LIST);
    // Wait for initial data load instead of arbitrary timeout
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    cy.get('button[data-testid="discussion-search-button"]').click(); // open the filter menu
    cy.get('div[data-testid="discussion-filter-search-bar"]')
      .find("input")
      .type(`${searchTerm}{enter}`);
    
    // Wait for search request to complete
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, filters discussions by text", () => {
    const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/discussions/`;
    const searchTerm = "topic 3";

    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');

    cy.visit(CHANNEL_VIEW);
    // Wait for initial data load instead of arbitrary timeout
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.get('button[data-testid="discussion-search-button"]').click(); // open the filter menu
    cy.get('div[data-testid="discussion-filter-search-bar"]')
      .find("input")
      .type(`${searchTerm}{enter}`);
    
    // Wait for search request to complete
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // should have one result
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").contains(searchTerm);
  });
});