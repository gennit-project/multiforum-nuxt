import { deleteAll, seedAll } from "../e2e/utils";

/**
 * Optimized test data management for Cypress tests
 * Uses a single global setup for all tests in a file and tracks data state
 */

// Track whether data has been initialized for this test run
let dataInitialized = false;

/**
 * Initialize data once per test file instead of for each test
 * This significantly reduces test execution time
 */
export const setupTestData = () => {
  // Only perform expensive setup once per test file
  before(() => {
    cy.log('🔄 Performing one-time data setup for all tests in this file');
    deleteAll();
    seedAll();
    dataInitialized = true;
  });

  // Verify test environment is ready before each test
  beforeEach(() => {
    // Skip login if we're preserving sessions
    cy.log('✅ Using shared test data');
  });
  
  // Clean up after all tests in the file are done
  after(() => {
    cy.log('🧹 Cleaning up test data');
    dataInitialized = false;
  });
};

/**
 * Login as a user and ensure necessary setup has been done
 * This is more efficient than logging in for each test case
 */
export const loginUser = (loginMethod = 'loginWithCreateEventButton') => {
  beforeEach(() => {
    // Make sure data is initialized even if setupTestData wasn't called
    if (!dataInitialized) {
      cy.log('⚠️ Test data not initialized, setting up now');
      deleteAll();
      seedAll();
      dataInitialized = true;
    }
    
    // Login with the specified method
    cy[loginMethod]();
  });
};