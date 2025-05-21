import { CATS_FORUM, CHANNEL_ISSUES } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Archive and unarchive discussion from issues page", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can report a discussion, archive it from issues page, and verify the archived banner appears", () => {
    const targetDiscussionTitle = "Example topic 1";
    // Use username_2 who is a moderator with appropriate permissions
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as the moderator
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Visit the forum and open the target discussion
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    cy.get("span").contains(targetDiscussionTitle).click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // wait for the button to be visible
    cy.get('button[data-testid="discussion-menu-button"]').should("be.visible");

    // Open the discussion action menu
    cy.get('button[data-testid="discussion-menu-button"]').click();

    // Click on the Report option (not Archive)
    cy.get('div[data-testid="discussion-menu-button-item-Report"]').click();

    // Check for the modal title
    cy.contains("Report Discussion").should("be.visible");

    // Select a forum rule
    // Use a longer timeout and retry until visible, matching the exact text in the UI
    cy.get("h3").contains("Forum rules for cats", { timeout: 10000 }).should("be.visible");
    cy.get("h3")
      .contains("Forum rules for cats")
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();

    // Add report text
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      "This is a test report for a forum rule violation that will be archived"
    );

    // Submit the report
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the success notification appears
    cy.contains("Your report was submitted successfully").should("be.visible");

    // Navigate to the channel issues tab
    cy.visit(CHANNEL_ISSUES);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the issue appears in the list
    cy.get('[data-testid="issue-list"]').contains(targetDiscussionTitle).should("be.visible");

    // Click on the issue to go to the issue detail page
    cy.get('[data-testid="issue-list"]').contains(targetDiscussionTitle).click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // scroll all the way to the bottom of the page
    cy.scrollTo("bottom");

    // Wait for the page to be fully hydrated. Wait until the logout button is visible
    cy.get('[data-testid="logout-button"]').should("be.visible", { timeout: 15000 });
    // Wait for the moderation wizard to be visible
    cy.get('[data-test="mod-wizard"]').should("be.visible", { timeout: 10000 });

    // Click the "Archive" button on the issue detail page
    cy.get("button").contains("Archive").click();

    // Wait for any GraphQL requests triggered by opening the modal
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify archive confirmation modal appears
    cy.contains("Archive Content").should("be.visible");

    // Select a server rule (sitewide rule)
    // Use a longer timeout and retry until visible, matching the exact text in the UI
    cy.get("h3").contains("Forum rules for cats", { timeout: 10000 }).should("be.visible");
    cy.get("h3")
      .contains("Forum rules for cats")
      .parent()
      .find('input[type="checkbox"]')
      .first()
      .check();

    // Add archive reason
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      "This discussion is being archived from the issues page"
    );

    // Submit the archive
    cy.get("button").contains("Submit").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify success notification
    cy.contains("The content was reported and archived successfully").should("be.visible");

    // Navigate to the original discussion to verify it's archived
    cy.get("#original-post-container").contains(targetDiscussionTitle).closest("a").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the archived banner appears
    cy.get('[data-testid="archived-discussion-banner"]').should("be.visible");
    cy.get('[data-testid="archived-discussion-banner"]')
      .contains("This discussion has been archived")
      .should("be.visible");

    // Navigate back to the forum discussions page
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the archived discussion is not visible in the list
    cy.get("span").contains(targetDiscussionTitle).should("not.exist");

    // Navigate to closed issues to verify it appears there
    cy.visit(`${CHANNEL_ISSUES}/closed`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the issue appears in closed issues
    cy.get('[data-testid="issue-list"]').contains(targetDiscussionTitle).should("be.visible");
  });

  it("can unarchive a discussion from the issues page and verify the archived banner disappears", () => {
    const targetDiscussionTitle = "Example topic 1";
    const username = Cypress.env("auth0_username_2");
    const password = Cypress.env("auth0_password_2");

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Login as the moderator
    cy.loginWithCreateEventButton({
      username: username,
      password: password,
    });

    // Navigate to closed issues
    cy.visit(`${CHANNEL_ISSUES}/closed`);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the issue appears in the list and click on it
    cy.get('[data-testid="issue-list"]').contains(targetDiscussionTitle).click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Wait for hydration to complete by checking for the logout button
    cy.get('[data-testid="logout-button"]').should("be.visible", { timeout: 15000 });

    // Just wait longer for the page to be fully hydrated
    cy.wait(3000);

    // Now open the issue by clicking data-testid="close-open-issue-button"
    cy.get('button[data-testid="close-open-issue-button"]')
      .should("be.visible", { timeout: 10000 })
      .click();

    // Submit the unarchive
    cy.get("button").contains("Unarchive").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify unarchive confirmation modal appears
    cy.contains("Unarchive Discussion").should("be.visible");

    // Add unarchive reason
    cy.get('textarea[data-testid="report-discussion-input"]').type(
      "This discussion is being unarchived from the issues page"
    );

    // Submit the unarchive
    cy.get('button[data-testid="unarchive-modal-primary-button"]').contains("Unarchive").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify success notification
    cy.contains("The content was unarchived successfully").should("be.visible");

    // Navigate to the original discussion to verify it's unarchived
    cy.get("#original-post-container").contains(targetDiscussionTitle).closest("a").click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the archived banner is no longer visible
    cy.get('[data-testid="archived-discussion-banner"]').should("not.exist");

    // Navigate back to the forum discussions page
    cy.visit(CATS_FORUM);
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the discussion is now visible in the list
    cy.get("span").contains(targetDiscussionTitle).should("be.visible");
  });
});
