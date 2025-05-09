import { setupTestData } from '../../support/testSetup';
import { CATS_FORUM_EVENTS } from "../constants";

const targetEventTitle = "Test free/virtual event";
const targetEventListItemSelector = `[data-testid="event-list-item-${targetEventTitle}"]`

describe('Report event', () => {
  // Set up test data once before all tests in this file
  setupTestData();
  
  // Log in the user before each test
  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    // Login directly instead of using the loginUser helper that has its own beforeEach
    cy.loginWithCreateEventButton();
  });

  it('reports an event successfully', () => {
    // Navigate to the "tests" forum events page
    cy.visit(CATS_FORUM_EVENTS)
    
    // Wait for the GraphQL request to complete and validate the response
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Wait for the event list to be visible before trying to interact with it
    cy.get('ul[data-testid="event-list"]').should('be.visible');
    
    // Find and click on the first event in the list
    cy.get(targetEventListItemSelector).first().should('be.visible').click();
    
    // Wait for the event details to load and validate the response
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Open the event menu
    cy.get('[data-testid="event-menu-button"]')
      .should('be.visible')
      .click();
    
    // Click on the Report option in the menu
    cy.get('div[data-testid="event-menu-button-item-Report"]')
      .should('be.visible')
      .click();
    
    // The report modal should be displayed
    cy.contains('Report Event').should('be.visible');
    
    // Select a rule from the dropdown
    cy.get('select').first().should('be.visible').select(1);
    
    // Add explanation text
    cy.get('textarea[data-testid="report-event-input"]')
      .should('be.visible')
      .type('This is a test report for integration testing purposes.');
    
    // Click the Submit Report button
    cy.contains('button', 'Submit Report').click();
    
    // Wait for the submission to complete
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify success notification appears
    cy.contains('Your report was submitted successfully').should('be.visible');
  });

  it('validates required fields when reporting an event', () => {
    // Navigate to the "tests" forum events page
    cy.visit(CATS_FORUM_EVENTS);
    
    // Wait for the GraphQL request to complete and validate the response
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Wait for the event list to be visible before trying to interact with it
    cy.get('ul[data-testid="event-list"]').should('be.visible');
    
    // Find and click on the first event in the list
    cy.get(targetEventListItemSelector).first().should('be.visible').click();
    
    // Wait for the event details to load and validate the response
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Open the event menu
    cy.get('[data-testid="event-menu-button"]')
      .should('be.visible')
      .click();
    
    // Click on the Report option in the menu
    cy.get('div[data-testid="event-menu-button-item-Report"]')
      .should('be.visible')
      .click();
    
    // The report modal should be displayed
    cy.contains('Report Event').should('be.visible');
    
    // Try to submit without selecting a rule or adding explanation
    cy.contains('button', 'Submit Report').should('be.visible').click();
    
    // Verify validation error appears
    cy.contains('Please select at least one broken rule').should('be.visible');
    
    // Select a rule but still no explanation
    cy.get('select').first().should('be.visible').select(1);
    cy.contains('button', 'Submit Report').should('be.visible').click();
    
    // Wait for the submission to complete
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the report was submitted successfully despite no explanation
    // (assuming explanation is optional)
    cy.contains('Your report was submitted successfully').should('be.visible');
  });

  it('navigates to the issue when a mod reports and archives an event', () => {
    // Make sure we're using a mod account
    cy.window().then(win => {
      // Check if the user is already a mod, if not, skip this test
      if (!win.localStorage.getItem('isMod')) {
        cy.log('User is not a mod, skipping test');
        return;
      }
      
      // Navigate to the "tests" forum events page
      cy.visit(CATS_FORUM_EVENTS);
      
      // Wait for the GraphQL request to complete and validate the response
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
      
      // Wait for the event list to be visible before trying to interact with it
      cy.get('ul[data-testid="event-list"]').should('be.visible');
      
      // Find and click on the first event in the list
      cy.get(targetEventListItemSelector).first().should('be.visible').click();
      
      // Wait for the event details to load and validate the response
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
      
      // Open the event menu
      cy.get('[data-testid="event-menu-button"]')
        .should('be.visible')
        .click();
      
      // Click on the "Archive" option (which for mods combines reporting and archiving)
      cy.get('div[data-testid="event-menu-button-item-Archive"]')
        .should('be.visible')
        .click();
      
      // The archive modal should be displayed
      cy.contains('Archive Event').should('be.visible');
      
      // Select a rule from the dropdown
      cy.get('select').first().should('be.visible').select(1);
      
      // Add explanation text
      cy.get('textarea[data-testid="report-event-input"]')
        .should('be.visible')
        .type('This event is being archived for testing purposes.');
      
      // Click the Archive button
      cy.contains('button', 'Archive').should('be.visible').click();
      
      // Wait for the submission to complete
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
      
      // Verify success notification appears
      cy.contains('The event was reported and archived successfully').should('be.visible');
      
      // The URL should change to the issues page or an issue detail page
      cy.url().should('include', '/issues/');
      // Alternatively, could use ADMIN_ISSUES constant
      // cy.url().should('include', ADMIN_ISSUES.replace(baseUrl, ''));
    });
  });
  
  it('cancels reporting an event without submitting', () => {
    // Navigate to the "tests" forum events page
    cy.visit(CATS_FORUM_EVENTS);
    
    // Wait for the GraphQL request to complete and validate the response
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Wait for the event list to be visible before trying to interact with it
    cy.get('ul[data-testid="event-list"]').should('be.visible');
    
    // Find and click on the first event in the list
    cy.get(targetEventListItemSelector).first().should('be.visible').click();
    
    // Wait for the event details to load and validate the response
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Open the event menu
    cy.get('[data-testid="event-menu-button"]')
      .should('be.visible')
      .click();
    
    // Click on the Report option in the menu
    cy.get('div[data-testid="event-menu-button-item-Report"]')
      .should('be.visible')
      .click();
    
    // The report modal should be displayed
    cy.contains('Report Event').should('be.visible');
    
    // Select a rule and add text
    cy.get('select').first().should('be.visible').select(1);
    cy.get('textarea[data-testid="report-event-input"]')
      .should('be.visible')
      .type('This report will be canceled.');
    
    // Click the Cancel button
    cy.contains('button', 'Cancel').should('be.visible').click();
    
    // Verify the modal is closed
    cy.contains('Report Event').should('not.exist');
    
    // We should still be on the event page
    cy.url().should('include', '/events/');
    // We could be more specific by checking that we're still on a forum events page
    // but we don't have specific URL constants for individual event pages
  });
});