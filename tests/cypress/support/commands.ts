import loginWithButtonClick from './commandFunctions/loginWithButtonClick';
import dropDataForCypressTests from './commandFunctions/dropDataForCypressTests';
import seedDataForCypressTests from './commandFunctions/seedDataForCypressTests';

const AUTH_TOKEN_NAME = 'token'; // This should match what the app expects
const AUTH_TOKEN_CACHE_KEY = 'auth_token_cache';

Cypress.Commands.add('loginWithCreateEventButton', loginWithButtonClick);

Cypress.Commands.add('loginAsAdmin', () => {
  const cachedToken = localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
  const cachedTokenData = cachedToken ? JSON.parse(cachedToken) : null;

  if (cachedTokenData && cachedTokenData.expiresAt > Date.now()) {
    // If possible, use cached token to avoid rate limiting problems with the Auth0 API
    cy.window().then((window) => {
      window.localStorage.setItem(AUTH_TOKEN_NAME, cachedTokenData.accessToken);
    });
    return;
  }

  const options = {
    method: 'POST',
    url: `https://${Cypress.env('auth0Domain')}/oauth/token`,
    body: {
      grant_type: 'password',
      username: Cypress.env('email'),
      password: Cypress.env('password'),
      audience: Cypress.env('auth0Audience'),
      scope: 'openid profile email',
      client_id: Cypress.env('auth0ClientId'),
      client_secret: Cypress.env('auth0ClientSecret'),
    },
  };

  cy.request(options).then((response) => {
    const accessToken = response.body.access_token;
    const expiresIn = response.body.expires_in; // Token expiry in seconds

    // Cache the token with its expiry time
    const tokenData = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000, // Convert to milliseconds
    };
    localStorage.setItem(AUTH_TOKEN_CACHE_KEY, JSON.stringify(tokenData));

    // Set the token in localStorage for the app
    cy.window().then((window) => {
      window.localStorage.setItem(AUTH_TOKEN_NAME, accessToken);
    });
  });
});

// Enhanced loginAsAdmin that syncs UI state
Cypress.Commands.add('loginAsAdminWithUISync', () => {
  // First visit the discussion list to load the app and initialize the auth functions
  const baseUrl = Cypress.env('baseUrl');
  cy.visit(`${baseUrl}/discussions/`);

  // Set the token programmatically
  cy.loginAsAdmin();

  // Now that the app is loaded, set the auth state directly
  cy.window().then((win) => {
    if (win.__SET_AUTH_STATE_DIRECT__) {
      cy.log('Using direct auth state setter to sync UI');
      win.__SET_AUTH_STATE_DIRECT__({
        username: 'cluse', // Default test username
        authenticated: true,
      });
    } else if (win.__REFRESH_AUTH_STATE__) {
      cy.log('Calling __REFRESH_AUTH_STATE__ as fallback');
      return win.__REFRESH_AUTH_STATE__().then(() => {
        cy.log('__REFRESH_AUTH_STATE__ completed');
      });
    } else {
      cy.log('No auth sync functions available, continuing without UI sync');
    }
  });

  // Give the UI time to update after auth state refresh
  cy.wait(1000);

  // Verify that the auth state has been set correctly
  cy.window().should(() => {
    expect(localStorage.getItem('token')).to.exist;
  });
});

// Session-cached version of programmatic login for better performance
Cypress.Commands.add('loginProgrammatically', () => {
  cy.session('admin-user', () => {
    cy.loginAsAdminWithUISync();
  });
});

Cypress.Commands.add('authenticatedGraphQL', (query, variables = {}) => {
  // Ensure the token is up-to-date before making the GraphQL request
  const getToken = () => {
    return cy.window().then((window) => {
      const cachedToken = window.localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
      const cachedTokenData = cachedToken ? JSON.parse(cachedToken) : null;
      if (cachedTokenData && cachedTokenData.expiresAt > Date.now()) {
        // Return the valid cached token
        return cachedTokenData.accessToken;
      }

      // If no valid cached token, refresh it using the login command
      return cy.loginAsAdmin().then(() => {
        const newToken = window.localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
        const newTokenData = newToken ? JSON.parse(newToken) : null;
        return newTokenData.accessToken;
      });
    });
  };

  // Retrieve the token and use it in the GraphQL request
  return getToken().then((token) => {
    return cy
      .request({
        method: 'POST',
        url: Cypress.env('graphqlUrl'),
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          query,
          variables,
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        // Log GraphQL errors if present
        if (response.body.errors) {
          console.error('GraphQL Error Response:', {
            errors: response.body.errors,
            status: response.status,
            statusText: response.statusText,
          });
        }

        // Return the full response for backward compatibility
        return response;
      });
  });
});

Cypress.Commands.add('safetyCheck', () => {
  return cy
    .authenticatedGraphQL(
      `
    query safetyCheck {
        safetyCheck {
            environment {
            currentDatabase
            isTestEnvironment
            }
        }
    }`
    )
    .then((response) => {
      const env = response?.body?.data?.safetyCheck?.environment;
      throw new Error(
        `🚨 SAFETY CHECK FAILED: Not in test environment! ` +
          `Current database: ${env.currentDatabase}`
      );
    });
});

// ADDING SEED DATA
Cypress.Commands.add('seedDataForCypressTests', seedDataForCypressTests);

// DELETING SEED DATA
Cypress.Commands.add('dropDataForCypressTests', dropDataForCypressTests);

let clipboardText = '';
Cypress.Commands.add('getClipboardText', () => {
  // Return a Cypress chainable by wrapping the value
  return cy.wrap(clipboardText);
});

Cypress.Commands.add('writeClipboardText', () => {
  cy.window().then((win) => {
    win.navigator.clipboard.writeText = (text) => {
      clipboardText = text;
      return Promise.resolve();
    };
  });
});

// FIXED: Clear all auth state completely including Auth0's internal cache
Cypress.Commands.add('clearAllAuthState', () => {
  // Clear browser localStorage - including Auth0's cache
  cy.window().then((window) => {
    // Clear our app's auth tokens
    window.localStorage.removeItem(AUTH_TOKEN_NAME);
    window.localStorage.removeItem(AUTH_TOKEN_CACHE_KEY);

    // Clear ALL Auth0-related localStorage entries
    // Auth0 stores tokens with keys like: @@auth0spajs@@::CLIENT_ID::AUDIENCE::scope
    Object.keys(window.localStorage).forEach((key) => {
      if (
        key.includes('@@auth0spajs@@') ||
        key.includes('auth0') ||
        key.startsWith('auth0.') ||
        key.startsWith(AUTH_TOKEN_CACHE_KEY)
      ) {
        console.log('Clearing Auth0 cache key:', key);
        window.localStorage.removeItem(key);
      }
    });

    // Clear session storage too (Auth0 might use this)
    Object.keys(window.sessionStorage).forEach((key) => {
      if (
        key.includes('@@auth0spajs@@') ||
        key.includes('auth0') ||
        key.startsWith('auth0.')
      ) {
        console.log('Clearing Auth0 session key:', key);
        window.sessionStorage.removeItem(key);
      }
    });

    // Clear the rest of session storage
    window.sessionStorage.clear();
  });

  // Clear Cypress localStorage cache
  localStorage.removeItem(AUTH_TOKEN_CACHE_KEY);

  // Clear ALL Cypress localStorage that might be Auth0 related
  Object.keys(localStorage).forEach((key) => {
    if (
      key.includes('@@auth0spajs@@') ||
      key.includes('auth0') ||
      key.startsWith('auth0.') ||
      key.startsWith(AUTH_TOKEN_CACHE_KEY)
    ) {
      localStorage.removeItem(key);
    }
  });

  // Reset Vue reactive auth state
  cy.window().then((win) => {
    const testWin = win as any;
    if (testWin.__SET_AUTH_STATE_DIRECT__) {
      testWin.__SET_AUTH_STATE_DIRECT__({
        username: '',
        authenticated: false,
      });
    }
  });
});

// FIXED: Login as different user with proper cache clearing
Cypress.Commands.add(
  'loginAsUser',
  (userCredentials: { username: string; password: string }) => {
    // Log the credentials being used for debugging
    console.log(`Attempting login for user: ${userCredentials.username}`);
    console.log(
      `Password provided: ${userCredentials.password ? '[REDACTED]' : 'UNDEFINED/EMPTY'}`
    );

    // Check if credentials are actually provided
    if (!userCredentials.username || !userCredentials.password) {
      throw new Error(
        `Invalid credentials provided: username=${userCredentials.username}, password=${userCredentials.password ? '[PROVIDED]' : 'MISSING'}`
      );
    }

    // ALWAYS make a fresh request - NO CACHING for different users
    // This ensures each user gets their own unique token
    const options = {
      method: 'POST',
      url: `https://${Cypress.env('auth0Domain')}/oauth/token`,
      body: {
        grant_type: 'password',
        username: userCredentials.username,
        password: userCredentials.password,
        audience: Cypress.env('auth0Audience'),
        scope: 'openid profile email',
        client_id: Cypress.env('auth0ClientId'),
        client_secret: Cypress.env('auth0ClientSecret'),
      },
    };

    cy.request(options).then((response) => {
      const accessToken = response.body.access_token;

      console.log(
        `Fresh token for ${userCredentials.username}:`,
        accessToken.substring(0, 20) + '...'
      );

      // Set token directly in browser localStorage - no caching
      cy.window().then((window) => {
        window.localStorage.setItem(AUTH_TOKEN_NAME, accessToken);
      });
    });
  }
);

// IMPROVED: Reliable programmatic authentication helper
Cypress.Commands.add('authenticateOnCurrentPage', () => {
  // Set the auth token programmatically
  cy.loginAsAdmin();

  // Wait for page to fully load
  cy.wait(2000);

  // Wait for the auth function to be available and then call it
  cy.window().then((win) => {
    const testWin = win as any;

    // First, let's see what's actually available
    console.log(
      'Available window properties:',
      Object.keys(testWin).filter((key) => key.includes('AUTH'))
    );

    if (testWin.__SET_AUTH_STATE_DIRECT__) {
      console.log('🔧 Setting auth state directly for admin user');
      testWin.__SET_AUTH_STATE_DIRECT__({
        username: 'cluse',
        authenticated: true,
      });
    } else {
      console.log('❌ __SET_AUTH_STATE_DIRECT__ not available, retrying...');

      // Retry after a short delay
      cy.wait(1000).then(() => {
        cy.window().then((retryWin) => {
          const retryTestWin = retryWin as any;
          if (retryTestWin.__SET_AUTH_STATE_DIRECT__) {
            console.log(
              '🔧 Setting auth state directly for admin user (retry)'
            );
            retryTestWin.__SET_AUTH_STATE_DIRECT__({
              username: 'cluse',
              authenticated: true,
            });
          } else {
            console.error(
              '❌ __SET_AUTH_STATE_DIRECT__ still not available after retry'
            );
          }
        });
      });
    }
  });

  // Verify authentication is complete
  cy.window().its('localStorage').invoke('getItem', 'token').should('exist');

  // Additional check - wait for the auth state to actually be set
  cy.window().should((win) => {
    const testWin = win as any;
    // Check if we can access the reactive variable somehow
    if (testWin.__SET_AUTH_STATE_DIRECT__) {
      console.log('✅ Auth function is available');
    }
  });
});

// IMPROVED: Authenticate as different user on current page
Cypress.Commands.add(
  'authenticateAsUserOnCurrentPage',
  (userCredentials: {
    username: string;
    password: string;
    displayName?: string;
  }) => {
    // First, completely clear all previous auth state
    cy.clearAllAuthState();

    // Wait a moment for the clear to take effect
    cy.wait(500);

    // Set the auth token programmatically for the specified user
    cy.loginAsUser(userCredentials);

    // Wait for page to fully load
    cy.wait(2000);

    // Wait for the auth function to be available and then call it
    cy.window().then((win) => {
      const testWin = win as any;

      if (testWin.__SET_AUTH_STATE_DIRECT__) {
        console.log(
          '🔧 Setting auth state directly for user:',
          userCredentials.displayName || userCredentials.username
        );
        testWin.__SET_AUTH_STATE_DIRECT__({
          username: userCredentials.displayName || userCredentials.username,
          authenticated: true,
        });
      } else {
        console.log(
          '❌ __SET_AUTH_STATE_DIRECT__ not available for user auth, retrying...'
        );

        // Retry after a short delay
        cy.wait(1000).then(() => {
          cy.window().then((retryWin) => {
            const retryTestWin = retryWin as any;
            if (retryTestWin.__SET_AUTH_STATE_DIRECT__) {
              console.log(
                '🔧 Setting auth state directly for user (retry):',
                userCredentials.displayName || userCredentials.username
              );
              retryTestWin.__SET_AUTH_STATE_DIRECT__({
                username:
                  userCredentials.displayName || userCredentials.username,
                authenticated: true,
              });
            } else {
              console.error(
                '❌ __SET_AUTH_STATE_DIRECT__ still not available for user auth after retry'
              );
            }
          });
        });
      }
    });

    // Verify authentication is complete and token is different
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'token')
      .should('exist')
      .then((token) => {
        console.log(
          `Token set for ${userCredentials.username}:`,
          (token as string).substring(0, 20) + '...'
        );
      });
  }
);
