import { CATS_FORUM, CHANNEL_ISSUES } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Archive and unarchive discussion", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can archive a discussion, see the archived banner, and verify the issue appears in closed issues", () => {
    const targetDiscussionTitle = "Example topic 1";
    // Use username_2 to ensure we're not the author of the discussion (created by username_1)
    // Username_2 should be an elevated mod with archive permissions
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");
    
    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Login as the second user who is a moderator
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
    
    // Click on the Archive option
    cy.get('div[data-testid="discussion-menu-button-item-Archive"]').click();
    
    // Check for the modal title
    cy.contains("Archive Discussion").should("be.visible");
    
    // Select a forum rule
    cy.get('h3').contains('Forum rules').should('be.visible');
    cy.get('h3').contains('Forum rules').parent().find('input[type="checkbox"]').first().check();
    
    // Add archive reason text
    cy.get('textarea[data-testid="report-discussion-input"]')
      .type("This is a test archive for a rule violation");
    
    // Submit the archive
    cy.get('button').contains('Submit').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the success notification appears
    cy.contains("The content was reported and archived successfully").should("be.visible");
    
    // Verify that the archived banner appears on the discussion
    cy.get('[data-testid="archived-discussion-banner"]').should('be.visible');
    cy.get('[data-testid="archived-discussion-banner"]').contains("This discussion has been archived").should('be.visible');
    
    // Now navigate to the channel's closed issues tab
    cy.visit(`${CHANNEL_ISSUES}/closed`);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify that the issue appears in the list of closed issues
    cy.get('[data-testid="issue-list"]').contains(targetDiscussionTitle).should('be.visible');


    // Visit the forum and open the target discussion
    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // archived discussion is no longer visible in the open discussions
    cy.get("span").contains(targetDiscussionTitle).should('not.exist');
  });

  it("can unarchive a discussion and verify the archived banner disappears", () => {
    const targetDiscussionTitle = "Example topic 1";
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");
    
    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Login as the moderator
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Navigate to the closed issues tab to find the archived discussion
    cy.visit(`${CHANNEL_ISSUES}/closed`);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // First click on the issue to navigate to the issue detail page
    cy.get('[data-testid="issue-list"]')
      .contains(targetDiscussionTitle)
      .click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Now on the issue detail page, find the specific link in the original-post-container
    cy.get('#original-post-container')
      .contains(targetDiscussionTitle)
      .closest('a') // Get the link containing the discussion title
      .click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the archived banner is visible
    cy.get('[data-testid="archived-discussion-banner"]').should('be.visible');
    
    // Open the discussion action menu
    cy.get('button[data-testid="discussion-menu-button"]').click();
    
    // Click on the Unarchive option
    cy.get('div[data-testid="discussion-menu-button-item-Unarchive"]').click();
    
    // Check for the unarchive modal
    cy.contains("Unarchive Discussion").should("be.visible");
    
    // Add unarchive reason text
    cy.get('textarea').type("This is a test unarchive");
    
    // Submit the unarchive
    cy.get('button').contains('Unarchive').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the success notification appears
    cy.contains("The content was unarchived successfully.").should("be.visible");
    
    // Verify that the archived banner no longer appears
    cy.get('[data-testid="archived-discussion-banner"]').should('not.exist');
    
    
    // Visit the forum and open the target discussion
    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    cy.get("span").contains(targetDiscussionTitle)
      .should('be.visible')

  });
});