import { DISCUSSION_CREATION_FORM } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Basic discussion operations", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  it("creates, edits and deletes a discussion", () => {
    const TEST_DISCUSSION = "Test discussion title";
    const TEST_BODY = "Test description";
    const TEST_CHANNEL = "cats";
    const TEST_BODY_2 = "Test description 2";
    const TEST_TAG_1 = "trivia";
    const TEST_TAG_2 = "music";
    const TEST_TAG_3 = "newYears";

    // Test creating a discussion.
    cy.visit(DISCUSSION_CREATION_FORM);

    // Add title
    cy.get('input[data-testid="title-input"]').type(TEST_DISCUSSION);

    // Add body
    cy.get('textarea[data-testid="body-input"]')
      .type(TEST_BODY);

    // Add channel
    cy.get('input[data-testid="channel-input"]').type(`${TEST_CHANNEL}{enter}`);

    // Add two tags
    cy.get('input[data-testid="tags-input"]').click();
    cy.get(`span[data-testid="tag-picker-${TEST_TAG_1}"]`).click();
    cy.get('input[data-testid="tags-input"]').click();
    cy.get(`span[data-testid="tag-picker-${TEST_TAG_2}"]`).click();

    cy.get("button").contains("Save").click().wait(1000);
    cy.get("h2").contains(TEST_DISCUSSION);
    cy.get("p").contains(TEST_BODY);

    // Test editing a discussion.
    cy.get('div[data-testid="discussion-menu-button')
      .click();
    // Click on the edit button
    cy.get("div").contains("Edit").click();

    // Change body
    cy.get('textarea[data-testid="body-input"]')
      .focus()
      .clear()
      .type(TEST_BODY_2);

    cy.get('input[data-testid="tags-input"]').click();

    // Add a new tag
    cy.get(`span[data-testid="tag-picker-${TEST_TAG_3}"]`).click();

    // Delete one of the existing tags
    cy.get(`span[data-testid='tags-input-tag-${TEST_TAG_1}']`)
        .find("svg[data-testid='tag-delete']")
        .click();

    cy.get("button").contains("Save").click();

    cy.get("p").contains(TEST_BODY_2);
    cy.get("span").contains(TEST_TAG_2);
    cy.get("span").contains(TEST_TAG_3);
    // Make sure the deleted tag is not present
    cy.get("span").should("not.contain", TEST_TAG_1);


    cy.get('div[data-testid="discussion-menu-button')
      .click();
    // Click on the delete button
    cy.get("div").contains("Delete").click()
    cy.get("button").contains("Delete").click()

    // After deletion, the user should be redirected to the discussion list
    // for the channel view
    cy.url().should("include", `${TEST_CHANNEL}/discussions`);
  });
});
