import { getConstantsForCypress } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

const constants = getConstantsForCypress(Cypress.env("baseUrl"));
const { CHANNEL_CREATION_FORM } = constants;

describe("Basic channel operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser('loginWithCreateEventButton');
  
  // Add verification that we're actually logged in
  beforeEach(() => {
    cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
  });

  it("creates and edits a channel", () => {
    const TEST_CHANNEL = "testChannel";
    const TEST_DESCRIPTION = "Test description";
    const TEST_TAG = "trivia";

    // Test creating a channel
    cy.visit(CHANNEL_CREATION_FORM)
      .wait(1000)

    cy.get('input[data-testid="title-input"]').type(TEST_CHANNEL);

    cy.get("button").contains("Save").click();
    cy.get("h1").contains(TEST_CHANNEL);

    // Test editing a channel
    cy.get("a").contains("Settings").click();
    cy.get('textarea[data-testid="description-input"]')
      .focus()
      .clear()
      .type(TEST_DESCRIPTION);

    cy.get('input[data-testid="tag-picker"]').click();
    cy.get(`span[data-testid="tag-picker-${TEST_TAG}"]`).click();

    cy.get("button").contains("Save").click();
    cy.get("div").contains(TEST_DESCRIPTION);
    cy.get("span").contains(TEST_TAG);
  });
});
