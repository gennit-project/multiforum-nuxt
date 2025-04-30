const baseUrl = Cypress.env("baseUrl");
const ONLINE_EVENT_LIST = `${baseUrl}/events/list/search`

export type LoginInput = {
  username: string;
  password: string;
};

const login = (input: LoginInput) => {
  const username = input?.username || Cypress.env("auth0_username");
  const password = input?.password || Cypress.env("auth0_password");

  // Use the original, proven approach that works reliably
  cy.visit(ONLINE_EVENT_LIST)
    .wait(3000)
    // click the button that says Log in
    .get("button")
    .contains("Log In")
    .click()
    .wait(1000);

  cy.origin(
    "https://gennit.us.auth0.com",
    { args: { username, password } },
    ({ username, password }) => {
      cy.get("#username").type(username);
      cy.get("#password").type(password);

      cy.get(
        'button[name="action"][value="default"][type="submit"][data-action-button-primary="true"]'
      )
        .click()
        .wait(1000);
    }
  );

  // Add a final wait for the redirect and page load to complete
  cy.wait(5000);
  
  // Check for "redirecting" text and wait longer if present
  cy.get('body').then($body => {
    if ($body.text().includes('redirecting')) {
      cy.log('Detected "redirecting" text, waiting longer for completion...');
      cy.wait(10000); // Wait an additional 10 seconds
    }
  });
};

export default login;