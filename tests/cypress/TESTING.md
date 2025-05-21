# Cypress Testing Optimizations

This document explains the optimizations made to the Cypress test suite to improve performance.

## Key Improvements

### 1. Shared Test Data Setup

**Before:**
Each test was resetting and re-seeding the database in its `beforeEach` hook, causing significant overhead.

```js
beforeEach(function () {
  deleteAll(); // Clear database
  seedAll(); // Seed all data
  cy.loginWithCreateEventButton();
});
```

**After:**
Data setup is now performed once per test file using `before` hooks, significantly reducing the time spent on database operations.

```js
// Import the utility functions
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Test suite", () => {
  // Run once per test file
  setupTestData();

  // Handle login before each test
  loginUser("loginWithCreateEventButton");

  it("test case", () => {
    // Test code here...
  });
});
```

### 2. How It Works

The `testSetup.ts` utility provides:

- `setupTestData()`: Initializes test data once per test file in a `before` hook
- `loginUser()`: Handles login for each test in a `beforeEach` hook
- State tracking to ensure data is properly initialized

### 3. Benefits

- **Faster Tests**: Significantly reduces the time spent on database operations
- **Less Resource Usage**: Reduces database load and network traffic
- **More Consistent**: Less variance in test execution time
- **Same Test Reliability**: Maintains test isolation where needed

### 4. Next Steps for Further Optimization

1. **Session Caching**: Implement `cy.session()` to cache Auth0 login state
2. **Selective Data Reset**: Create focused data reset functions for specific test needs
3. **Parallelization**: Set up test parallelization with Cypress Dashboard
4. **Network Interception**: Replace arbitrary waits with network request watching
5. **Custom Test Data**: Create test-specific data instead of reusing the same data

## Usage

To convert an existing test file:

1. Import the utilities:

   ```js
   import { setupTestData, loginUser } from "../../support/testSetup";
   ```

2. Replace your `beforeEach` data setup with:

   ```js
   setupTestData();
   loginUser("loginWithCreateEventButton");
   ```

3. Remove manual calls to `deleteAll()` and `seedAll()`
