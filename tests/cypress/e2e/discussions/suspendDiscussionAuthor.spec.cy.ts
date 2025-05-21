import { CATS_FORUM, DISCUSSION_CREATION_FORM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Suspend and unsuspend discussion author", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can suspend a discussion author from action menu and then unsuspend them from issues", () => {
    // First user (username_1) will create a discussion that will be moderated
    const authorUsername = Cypress.env("auth0_username_1");
    const authorPassword = Cypress.env("auth0_password_1");

    // Test discussion title that will be used to identify the created discussion
    const testDiscussionTitle = "Test discussion for suspension " + Date.now();

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // PART 1: Create a discussion as the author
    // ------------------------------------------------

    // Login as the author (username_1) to create a discussion
    cy.loginWithCreateEventButton({
      username: authorUsername,
      password: authorPassword,
    });

    // Navigate to the discussion creation form
    cy.visit(DISCUSSION_CREATION_FORM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Fill in the discussion form using the correct selectors
    cy.get('input[data-testid="title-input"]').type(testDiscussionTitle);
    cy.get('textarea[data-testid="body-input"]').type(
      "This is a test discussion for testing user suspension."
    );

    // Select the cats forum using the forum picker
    cy.get('div[data-testid="channel-input"]').type("cats{enter}");
    cy.get('span[data-testid="forum-picker-cats"]').click();

    // Submit the form
    cy.get("button").contains("Save").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the discussion was created successfully
    cy.get("h2").contains(testDiscussionTitle).should("be.visible");

    // PART 2: Switch users and suspend the author
    // ------------------------------------------------

    // Log out by clicking the log out button in the top nav
    cy.get('button[data-testid="logout-button"]').click();
    cy.wait(2000); // Wait for logout to complete

    // Second user (username_2) will be the moderator who suspends the other user
    const modUsername = Cypress.env("auth0_username_2");
    const modPassword = Cypress.env("auth0_password_2");

    // Login as the moderator (username_2)
    cy.loginWithCreateEventButton({
      username: modUsername,
      password: modPassword,
    });

    // Navigate to the cats forum
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Find and click on the created discussion
    cy.contains(testDiscussionTitle).click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Wait for the discussion menu button to be available
    cy.get('button[data-testid="discussion-menu-button"]').should("be.visible");

    // Open the discussion action menu using the correct selector
    cy.get('button[data-testid="discussion-menu-button"]').click();

    // Click on the "Archive and Suspend" option using the correct selector
    cy.get('div[data-testid="discussion-menu-button-item-Archive and Suspend"]').click();

    // Verify the modal title
    cy.contains("Suspend Author").should("be.visible");

    // Select a forum rule
    cy.get("h3").contains("Forum rules").should("be.visible");
    cy.get("h3").contains("Forum rules").parent().find('input[type="checkbox"]').first().check();

    // Select suspension duration
    cy.contains("Suspend user for").should("be.visible");
    cy.get("select").select("Two Weeks");

    // Add suspension explanation
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      "This is a test suspension of a user."
    );

    // Submit the form
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the success notification appears
    cy.contains("Archived the post and suspended the author").should("be.visible");

    // Step 3: Navigate to the forum's suspended users section
    cy.visit(`${CATS_FORUM.replace("discussions", "edit/suspended-users")}`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the author was suspended
    cy.contains(authorUsername).should("be.visible");
    cy.contains("Suspended until").should("be.visible");

    // Find and click the "Related Issue" link
    cy.contains("Related Issue").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Step 4: On the issue page, click to unsuspend the user
    cy.contains("Unsuspend User").click();

    // Verify the unsuspend modal is shown
    cy.contains("Unsuspend Author").should("be.visible");

    // Add explanation for unsuspending
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      "This user was suspended as part of an automated test. Unsuspending now."
    );

    // Submit the unsuspend form
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the success notification appears (check for common success terms)
    cy.contains(/successfully|completed/i).should("be.visible");

    // Step 5: Go back to the suspended users page to verify user was removed
    cy.visit(`${CATS_FORUM.replace("discussions", "edit/suspended-users")}`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the author is no longer in the suspended users list
    cy.contains(authorUsername).should("not.exist");
    cy.contains("This forum has no suspended users").should("be.visible");
  });
});
