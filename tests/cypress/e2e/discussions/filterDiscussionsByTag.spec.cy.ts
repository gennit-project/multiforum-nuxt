import { DISCUSSION_LIST } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Filter discussions by tag", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser("loginWithCreateEventButton");

  const newYearsTagDiscussionTitle = "Example topic 2";
  const triviaTaggedDiscussionTitle = "Example topic 3";

  it("in the sitewide online discussions list, filters discussions by tag", () => {
    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    cy.visit(DISCUSSION_LIST);
    // Wait for initial data load instead of arbitrary timeout
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="discussion-filter-button"]').click(); // open the filter menu
    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

    cy.get('span[data-testid="tag-picker-newYears"]').click(); // click the newYears tag
    // Wait for filter request to complete
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();
    // Wait for filter request to complete
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // should have two results
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 2);

    // The expected discussions are in the results
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(triviaTaggedDiscussionTitle);
  });

  it("in a channel view, filters discussions by tag", () => {
    const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/discussions/`;
    const searchTerm = "trivia";

    // Set up network interception for GraphQL requests
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    cy.visit(CHANNEL_VIEW);
    // Wait for initial data load instead of arbitrary timeout
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="discussion-filter-button"]').click(); // open the filter menu
    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();
    // Wait for filter request to complete
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // should have one result
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").contains(searchTerm);

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();
    // Wait for filter request to complete
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // should have two results
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").should("have.length", 2);

    // The expected discussions are in the results
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .contains(triviaTaggedDiscussionTitle);
  });
});
