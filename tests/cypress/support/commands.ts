import loginWithButtonClick from "./commandFunctions/loginWithButtonClick";
import dropDataForCypressTests from "./commandFunctions/dropDataForCypressTests";
import seedDataForCypressTests from "./commandFunctions/seedDataForCypressTests";

const AUTH_TOKEN_NAME = "authToken";
const AUTH_TOKEN_CACHE_KEY = "auth_token_cache";

Cypress.Commands.add("loginWithCreateEventButton", loginWithButtonClick);

Cypress.Commands.add("loginAsAdmin", () => {
  const cachedTokenData = JSON.parse(
    localStorage.getItem(AUTH_TOKEN_CACHE_KEY)
  );

  if (cachedTokenData && cachedTokenData.expiresAt > Date.now()) {
    // If possible, use cached token to avoid rate limiting problems with the Auth0 API
    cy.window().then((window) => {
      window.localStorage.setItem(AUTH_TOKEN_NAME, cachedTokenData.accessToken);
    });
    return;
  }

  const options = {
    method: "POST",
    url: `https://${Cypress.env("auth0Domain")}/oauth/token`,
    body: {
      grant_type: "password",
      username: Cypress.env("email"),
      password: Cypress.env("password"),
      audience: Cypress.env("auth0Audience"),
      scope: "openid profile email",
      client_id: Cypress.env("auth0ClientId"),
      client_secret: Cypress.env("auth0ClientSecret"),
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

Cypress.Commands.add("authenticatedGraphQL", (query, variables = {}) => {
  // Ensure the token is up-to-date before making the GraphQL request
  const getToken = () => {
    return cy.window().then((window) => {
      const cachedTokenData = JSON.parse(
        window.localStorage.getItem(AUTH_TOKEN_CACHE_KEY)
      );
      if (cachedTokenData && cachedTokenData.expiresAt > Date.now()) {
        // Return the valid cached token
        return cachedTokenData.accessToken;
      }

      // If no valid cached token, refresh it using the login command
      return cy.loginAsAdmin().then(() => {
        const newTokenData = JSON.parse(
          window.localStorage.getItem(AUTH_TOKEN_CACHE_KEY)
        );
        return newTokenData.accessToken;
      });
    });
  };

  // Retrieve the token and use it in the GraphQL request
  return getToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: Cypress.env("graphqlUrl"),
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
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
          console.error("GraphQL Error Response:", {
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

Cypress.Commands.add("safetyCheck", () => {
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
Cypress.Commands.add("seedDataForCypressTests", seedDataForCypressTests);

// DELETING SEED DATA
Cypress.Commands.add("dropDataForCypressTests", dropDataForCypressTests);

let clipboardText = "";
Cypress.Commands.add("getClipboardText", () => {
  // Return a Cypress chainable by wrapping the value
  return cy.wrap(clipboardText);
});

Cypress.Commands.add("writeClipboardText", () => {
  cy.window().then((win) => {
    win.navigator.clipboard.writeText = (text) => {
      clipboardText = text;
      return Promise.resolve();
    };
  });
});