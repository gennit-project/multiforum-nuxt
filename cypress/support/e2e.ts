
// Create a separate function for the safety check
const performSafetyCheck = () => {
  cy.loginAsAdmin();
  return cy.authenticatedGraphQL(`
    query safetyCheck {
      safetyCheck {
        environment {
          currentDatabase
          isTestEnvironment
        }
      }
    }
  `).then((response) => {
    const env = response?.body?.data?.safetyCheck?.environment;

    if (!env?.isTestEnvironment) {
      throw new Error(
        `🚨 SAFETY CHECK FAILED: Attempted to run tests in wrong environment!\n` +
          `Current database: ${env?.currentDatabase}\n` +
          `❌ ALL TESTS BLOCKED FOR SAFETY`
      );
    }

    cy.log("✅ Safety check passed - running in test environment");
    return true;
  });
};

// Add more visible logging
before(() => {
  cy.log('🔍 Starting global safety check...');
  performSafetyCheck().then((passed) => {
    if (passed) {
      cy.log('🚀 All systems go - tests can proceed');
    } 
  });
});

// Optional: Add extra protection for test files
beforeEach(() => {
  cy.log('Verifying safety check completed...');
  if (!Cypress.env('safetyCheckPassed')) {
    throw new Error('Tests attempted to run before safety check completed');
  }
});