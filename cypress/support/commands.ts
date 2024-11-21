import loginWithButtonClick from "./commandFunctions/loginWithButtonClick";
import seedEvents from "./commandFunctions/seed/seedEvents";
import seedUsers from "./commandFunctions/seed/seedUsers";
import seedChannels from "./commandFunctions/seed/seedChannels";
import seedDiscussions from "./commandFunctions/seed/seedDiscussions";
import seedTags from "./commandFunctions/seed/seedTags";
import createEvents from "./commandFunctions/createEvents";
import createDiscussions from "./commandFunctions/createDiscussions";
import seedModChannelRoles from "./commandFunctions/seed/rbac/seedModChannelRole";
import seedChannelRoles from "./commandFunctions/seed/rbac/seedChannelRoles";
import seedModServerRoles from "./commandFunctions/seed/rbac/seedModServerRoles";
import seedServerRoles from "./commandFunctions/seed/rbac/seedServerRoles";
import seedServerConfig from "./commandFunctions/seed/rbac/seedServerConfig";
import dropDataForCypressTests from "./commandFunctions/dropDataForCypressTests";

const AUTH_TOKEN_NAME = "authToken";

Cypress.Commands.add("loginWithCreateEventButton", loginWithButtonClick);

Cypress.Commands.add("loginAsAdmin", () => {
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
    console.log("let's see what we got from auth0", JSON.stringify(response));
    cy.window().then((window) => {
      window.localStorage.setItem(AUTH_TOKEN_NAME, response.body.access_token);
    });
  });
});

Cypress.Commands.add("authenticatedGraphQL", (query, variables = {}) => {
  cy.window().then((window) => {
    const token = window.localStorage.getItem(AUTH_TOKEN_NAME);
    // Set the token for use in the next command
    Cypress.env("tempAuthToken", token);
    // Return the request directly

    console.log("token in authenticated graphql", token);
    return cy.request({
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
Cypress.Commands.add("seedDiscussions", seedDiscussions);
Cypress.Commands.add("seedEvents", seedEvents);
Cypress.Commands.add("seedUsers", seedUsers);
Cypress.Commands.add("seedChannels", seedChannels);
Cypress.Commands.add("seedTags", seedTags);
Cypress.Commands.add("seedModChannelRoles", seedModChannelRoles);
Cypress.Commands.add("seedChannelRoles", seedChannelRoles);
Cypress.Commands.add("seedModServerRoles", seedModServerRoles);
Cypress.Commands.add("seedServerRoles", seedServerRoles);
Cypress.Commands.add("seedServerConfig", seedServerConfig);
Cypress.Commands.add("createEvents", createEvents);
Cypress.Commands.add("createDiscussions", createDiscussions);

// DELETING SEED DATA
Cypress.Commands.add("dropDataForCypressTests", dropDataForCypressTests);
