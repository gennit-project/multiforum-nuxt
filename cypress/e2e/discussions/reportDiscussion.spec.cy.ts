import { CATS_FORUM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Report a discussion", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can report a discussion as a logged-in user", () => {
    const targetDiscussionTitle = "Example topic 1";
    // Use username_2 to ensure we're not the author of the discussion (created by username_1)
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");
    
    // Login as the second user who is not the author of the discussion
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Visit the forum and open the target discussion
    cy.visit(CATS_FORUM).wait(1000);
    cy.get("span").contains(targetDiscussionTitle).click();
    
    // Open the discussion action menu
    cy.get('button[data-testid="discussion-menu-button"]').click();
    
    // Click on the Report option
    cy.get('div[data-testid="discussion-menu-button-item-Report"]').click();
    
    // Wait for the modal to appear
    cy.wait(1000);
    
    // Check for the modal title
    cy.contains("Report Discussion").should("be.visible");
    
    // Select at least one rule (required for submission)
    cy.get('input[type="checkbox"]').first().check();
    
    // Add report text
    cy.get('textarea[data-testid="texteditor-textarea"]')
      .type("This is a test report for automated testing");
    
    // Submit the report
    cy.get('button[data-testid="generic-modal-primary-button"]').click();
    
    // Verify the success notification appears
    cy.contains("Your report was submitted successfully.").should("be.visible");
  });
});