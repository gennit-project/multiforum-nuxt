import { CHANNEL_CREATION_FORM } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic channel operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("creates and edits a channel", () => {
    const TEST_CHANNEL = "testChannel";
    const TEST_DESCRIPTION = "Test description";
    const TEST_DESCRIPTION_2 = "Test description 2";
    const TEST_TAG = "trivia";

    // Test creating a channel
    cy.visit(CHANNEL_CREATION_FORM);
   
    cy.get('textarea[data-testid="description-input"]')
      .type(TEST_DESCRIPTION, { force: true })

    cy.get('input[data-testid="title-input"]').type(TEST_CHANNEL);

    cy.get("button").contains("Save").click();
    cy.get("h1").contains(TEST_CHANNEL);
    cy.get("div").contains(TEST_DESCRIPTION);

    // Test editing a channel
    cy.get("a").contains("Settings").click();
    cy.get('textarea[data-testid="description-input"]')
      .focus()
      .clear()
      .type(TEST_DESCRIPTION_2);

    cy.get('input[data-testid="tags-input"]').click();
    cy.get(`span[data-testid="tag-picker-${TEST_TAG}"]`).click();

    cy.get("button").contains("Save").click();
    cy.get("div").contains(TEST_DESCRIPTION_2);
    cy.get("span").contains(TEST_TAG);
  });
});
