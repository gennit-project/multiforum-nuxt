import { getConstantsForCypress } from "../constants";
import { setupTestData } from "../../support/testSetup";

const constants = getConstantsForCypress(Cypress.env("baseUrl"));
const { CHANNEL_CREATION_FORM } = constants;

describe("Basic channel operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  
  it("creates and edits a channel", () => {
    const TEST_CHANNEL = "testChannel";
    const TEST_DESCRIPTION = "Test description";
    const TEST_TAG = "trivia";

    // Set up GraphQL request interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Intercept specific GraphQL operations
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('createChannels')) {
        req.alias = 'createChannelRequest';
      } else if (req.body.query?.includes('updateChannels')) {
        req.alias = 'updateChannelRequest';
      }
    });

    // Visit the page first
    cy.visit(CHANNEL_CREATION_FORM);
    
    // Authenticate programmatically on current page
    cy.authenticateOnCurrentPage();
    
    // Wait for the page to load and form to be ready
    cy.get('input[data-testid="title-input"]').should('be.visible');

    cy.get('input[data-testid="title-input"]').type(TEST_CHANNEL);

    cy.get("button").contains("Save").click();
    cy.wait('@createChannelRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the channel was created successfully
    cy.get("h1").contains(TEST_CHANNEL);

    // Test editing a channel
    cy.get("a").contains("Settings").click();
    
    // Wait for the settings page to load
    cy.get('textarea[data-testid="description-input"]').should('be.visible');
    
    cy.get('textarea[data-testid="description-input"]')
      .should('be.visible')
      .focus()
      .clear()
      .type(TEST_DESCRIPTION);

    cy.get('input[data-testid="tag-picker"]')
      .should('be.visible')
      .click();
      
    // Add a wait for the dropdown to fully appear
    cy.wait(500);
    
    // More robust tag selection - try different approaches
    cy.get('body').then($body => {
      // Try the specific data-testid first
      if ($body.find(`[data-testid="tag-picker-${TEST_TAG}"]`).length) {
        cy.get(`[data-testid="tag-picker-${TEST_TAG}"]`).click();
      } 
      // Fallback to text content if data-testid not found
      else if ($body.find('.v-list-item__content:contains("trivia")').length) {
        cy.contains('.v-list-item__content', TEST_TAG).click();
      }
      // Last resort - find anything with the text
      else {
        cy.contains(TEST_TAG).click();
      }
    });

    cy.get("button").contains("Save").click();
    cy.wait('@updateChannelRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the channel was updated successfully
    cy.get("div").contains(TEST_DESCRIPTION);
    cy.get("span").contains(TEST_TAG);
  });
});
