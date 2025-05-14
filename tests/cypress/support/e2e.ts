// Import commands using require instead of import
import './commands';

Cypress.on('fail', (error) => {
  if (error.message.includes('SAFETY CHECK FAILED')) {
    Cypress.log({
      name: '🚨 SAFETY CHECK FAILED',
      message: error.message,
      consoleProps: () => ({
        Error: error.message,
      }),
    });
    console.error('\n\n🚨 SAFETY CHECK FAILED 🚨');
    console.error(error.message);
    throw new Error(`FATAL: ${error.message}`);
  }
  throw error;
});

const performSafetyCheck = () => {
  cy.loginAsAdmin(); // Ensure the admin login runs before the query

  // Chainable Cypress flow
  cy.authenticatedGraphQL(`
    query SafetyCheck {
      safetyCheck {
        environment {
          currentDatabase
          isTestEnvironment
        }
      }
    }
  `).then((response) => {
    const env = response?.body?.data?.safetyCheck?.environment;

    if (!env) {
      throw new Error(
        `🚨 SAFETY CHECK FAILED: Could not retrieve environment information.\n` +
        `Response received: ${JSON.stringify(response?.body, null, 2)}\n` +
        `❌ ALL TESTS BLOCKED FOR SAFETY`
      );
    }

    if (!env.isTestEnvironment) {
      throw new Error(
        `🚨 SAFETY CHECK FAILED: Attempted to run tests in wrong environment!\n` +
        `Current database: ${env.currentDatabase}\n` +
        `❌ ALL TESTS BLOCKED FOR SAFETY\n\n` +
        `To fix this:\n` +
        `1. Make sure you're running against your test database\n` +
        `2. Check your environment variables\n` +
        `3. Verify your GraphQL endpoint is correct`
      );
    }

    Cypress.env('safetyCheckPassed', true);
    cy.log("✅ Safety check passed - running in test environment");
  });
};



before(function () {
  this.timeout(30000);
  
  cy.log('🔍 Starting global safety check...');
  performSafetyCheck();
});


beforeEach(() => {
  if (!Cypress.env('safetyCheckPassed')) {
    throw new Error(
      `🚨 Safety check has not completed successfully.\n` +
      `This might mean:\n` +
      `1. The before() hook failed\n` +
      `2. The safety check was bypassed\n` +
      `3. There's an issue with test setup\n\n` +
      `Please check the test output above for more details.`
    );
  }
});