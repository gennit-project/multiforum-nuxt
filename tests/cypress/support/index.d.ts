/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Log in programmatically using Auth0 API
     */
    loginAsAdmin(): Chainable<void>;

    /**
     * Log in programmatically and sync UI state for tests
     */
    loginAsAdminWithUISync(): Chainable<void>;

    /**
     * Log in programmatically with session caching for better performance
     */
    loginProgrammatically(): Chainable<void>;

    /**
     * Log in using UI button click
     */
    loginWithCreateEventButton(): Chainable<void>;

    /**
     * Make authenticated GraphQL request
     */
    authenticatedGraphQL(query: string, variables?: any): Chainable<any>;

    /**
     * Perform safety check to ensure test environment
     */
    safetyCheck(): Chainable<any>;

    /**
     * Seed test data
     */
    seedDataForCypressTests(): Chainable<void>;

    /**
     * Drop test data
     */
    dropDataForCypressTests(): Chainable<void>;

    /**
     * Get clipboard text
     */
    getClipboardText(): Chainable<string>;

    /**
     * Setup clipboard text writing
     */
    writeClipboardText(): Chainable<void>;
  }
}
