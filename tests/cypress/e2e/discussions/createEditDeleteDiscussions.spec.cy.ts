import { DISCUSSION_CREATION_FORM } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Basic discussion operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  // Use the original UI-based login method that works reliably
  loginUser("loginWithCreateEventButton");

  it("creates, edits and deletes a discussion", () => {
    const TEST_DISCUSSION = "Test discussion title";
    const TEST_BODY = "Test description";
    const TEST_CHANNEL = "cats";
    const TEST_BODY_2 = "Test description 2";
    const TEST_TAG_1 = "trivia";
    const TEST_TAG_2 = "music";
    const TEST_TAG_3 = "newYears";

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Test creating a discussion.
    cy.visit(DISCUSSION_CREATION_FORM);

    // Add title
    cy.get('input[data-testid="title-input"]').type(TEST_DISCUSSION);

    // Add body
    cy.get('textarea[data-testid="body-input"]').type(TEST_BODY);

    // Add channel
    cy.get('div[data-testid="channel-input"]').type(`${TEST_CHANNEL}{enter}`);
    cy.get(`span[data-testid="forum-picker-${TEST_CHANNEL}"]`).click();

    // Add two tags
    cy.get('input[data-testid="tag-picker"]').click();
    cy.get(`span[data-testid="tag-picker-${TEST_TAG_1}"]`).click();
    cy.get(`span[data-testid="tag-picker-${TEST_TAG_2}"]`).click();

    // Click save and wait for network request to complete instead of arbitrary timeout
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the discussion was created successfully
    cy.get("h2").contains(TEST_DISCUSSION);
    cy.get("p").contains(TEST_BODY);

    // Test editing a discussion.
    cy.get('button[data-testid="discussion-menu-button').click();
    // Click on the edit button
    cy.get("div[data-testid=discussion-menu-button-item-Edit]").click();

    // Change body
    cy.get('textarea[data-testid="body-input"]').focus().clear().type(TEST_BODY_2);

    cy.get('input[data-testid="tag-picker"]').click();

    // Add a new tag
    cy.get(`span[data-testid="tag-picker-${TEST_TAG_3}"]`).click();

    // Delete one of the existing tags
    cy.get(`span[data-testid='tag-picker-${TEST_TAG_1}']`).click();

    // Save changes and wait for network request to complete
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the changes were applied
    cy.get("p").contains(TEST_BODY_2);
    cy.get("span").contains(TEST_TAG_2);
    cy.get("span").contains(TEST_TAG_3);
    // Make sure the deleted tag is not present
    cy.get("span").should("not.contain", TEST_TAG_1);

    // Delete the discussion
    cy.get('button[data-testid="discussion-menu-button').click();
    // Click on the delete button
    cy.get("div[data-testid=discussion-menu-button-item-Delete]").click();
    cy.get("button").contains("Delete").click();

    // Wait for delete request to complete
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // After deletion, the user should be redirected to the discussion list
    // for the channel view
    cy.url().should("include", `${TEST_CHANNEL}/discussions`);
  });
});
