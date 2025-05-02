import { CATS_FORUM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Report discussion", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can report a discussion with sitewide rule violation and view the issue in admin dashboard", () => {
    const targetDiscussionTitle = "Example topic 1";
    // Use username_2 to ensure we're not the author of the discussion (created by username_1)
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");
    
    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Login as the second user who is not the author of the discussion
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Visit the forum and open the target discussion
    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    cy.get("span").contains(targetDiscussionTitle).click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Open the discussion action menu
    cy.get('button[data-testid="discussion-menu-button"]').click();
    
    // Click on the Report option
    cy.get('div[data-testid="discussion-menu-button-item-Report"]').click();
    
    // Check for the modal title
    cy.contains("Report Discussion").should("be.visible");
    
    // Select a server rule (sitewide rule)
    cy.get('h3').contains('Server Rules').should('be.visible');
    cy.get('h3').contains('Server Rules').parent().find('input[type="checkbox"]').first().check();
    
    // Add report text
    cy.get('textarea[data-testid="texteditor-textarea"]')
      .type("This is a test report for a sitewide rule violation");
    
    // Submit the report
    cy.get('button').contains('Submit').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the success notification appears
    cy.contains("Your report was submitted successfully").should("be.visible");
    
    // Now navigate to the admin dashboard's issues tab
    cy.visit('/admin/issues');
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify that the issue appears in the list
    cy.get('table tbody tr').contains(targetDiscussionTitle).should('be.visible');
  });

  it("can report a discussion with channel rule violation and view the issue in channel issues tab", () => {
    const targetDiscussionTitle = "Example topic 1";
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");
    
    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Login as the second user who is not the author of the discussion
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Visit the forum and open the target discussion
    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    cy.get("span").contains(targetDiscussionTitle).click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Open the discussion action menu
    cy.get('button[data-testid="discussion-menu-button"]').click();
    
    // Click on the Report option
    cy.get('div[data-testid="discussion-menu-button-item-Report"]').click();

    // In the broken rules modal that appears, select a forum/channel rule
    cy.get('h3').contains('Forum rules for cats').should('be.visible');
    // Select the first forum rule in the list
    cy.get('h3').contains('Forum rules for cats').parent().find('input[type="checkbox"]').first().check();
    
    // Add some report text
    cy.get('textarea[data-testid="texteditor-textarea"]').type("This is a test report for a channel rule violation");
    
    // Submit the report
    cy.get('button').contains('Submit').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Check for success notification
    cy.contains("Your report was submitted successfully").should("be.visible");
    
    // Now navigate to the channel issues tab
    cy.visit('/forums/cats/issues');
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify that the issue appears in the list
    cy.get('table tbody tr').contains(targetDiscussionTitle).should('be.visible');
  });
});