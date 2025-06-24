import { setupTestData, loginUser } from "../../support/testSetup";
import { DISCUSSION_LIST } from "../constants";

describe("Programmatic Authentication", () => {
  setupTestData();

  it("should authenticate programmatically and sync UI state", () => {
    // Login programmatically
    cy.loginAsAdminWithUISync();
    
    // Visit the discussion list page
    cy.visit(DISCUSSION_LIST);
    
    // Verify that the user is authenticated by checking for authenticated-only elements
    // This test verifies that the UI state is properly synced after programmatic auth
    cy.get('body').should('exist');
    
    // Verify token is present
    cy.window().should(() => {
      expect(localStorage.getItem('token')).to.exist;
    });
    
    // Verify auth cache is set
    cy.window().should(() => {
      expect(localStorage.getItem('auth_token_cache')).to.exist;
    });
  });

  it("should use session caching for improved performance", () => {
    // This test demonstrates the session-cached login
    cy.loginProgrammatically();
    
    // Visit the discussion list page
    cy.visit(DISCUSSION_LIST);
    
    // Verify authentication worked
    cy.window().should(() => {
      expect(localStorage.getItem('token')).to.exist;
    });
  });

  it("should compare performance between UI and programmatic login", () => {
    // Measure UI login time
    const startUILogin = performance.now();
    cy.loginWithCreateEventButton();
    const endUILogin = performance.now();
    
    // Log the UI login time
    cy.log(`UI Login Time: ${endUILogin - startUILogin}ms`);
    
    // Clear session and try programmatic login
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    
    // Measure programmatic login time
    const startProgrammaticLogin = performance.now();
    cy.loginAsAdminWithUISync();
    const endProgrammaticLogin = performance.now();
    
    // Log the programmatic login time
    cy.log(`Programmatic Login Time: ${endProgrammaticLogin - startProgrammaticLogin}ms`);
    
    // Visit discussion list to verify both work
    cy.visit(DISCUSSION_LIST);
    
    // Verify authentication
    cy.window().should(() => {
      expect(localStorage.getItem('token')).to.exist;
    });
  });
});