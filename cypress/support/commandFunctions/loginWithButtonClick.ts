import config from "../../../src/config";

const ONLINE_EVENT_LIST = `${config.baseUrl}/events/list/search`

export type LoginInput = {
  username: string;
  password: string;
};

const login = (input: LoginInput) => {
  const username = input?.username || Cypress.env("auth0_username");
  const password = input?.password || Cypress.env("auth0_password");

  cy.visit(ONLINE_EVENT_LIST)
    .get('[data-testid="fake-create-anything-button"]')
    .click();

  cy.origin(
    "https://gennit.us.auth0.com",
    { args: { username, password } },  // Sending arguments to the separate instance.
    // see https://docs.cypress.io/api/commands/origin#Using-dynamic-data-in-a-secondary-origin
    ({ username, password }) => {
      cy.get("#username").type(username);
      cy.get("#password").type(password);

      // Click the button that says continue
      cy.get(
        'button[name="action"][value="default"][type="submit"][data-action-button-primary="true"]'
      )
        .click()
        .wait(1000);
    }
  );
};

export default login;
