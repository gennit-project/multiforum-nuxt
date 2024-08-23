import { DISCUSSION_LIST } from "../constants";
import { deleteAll } from "../utils";
import { discussionsForFilteringTests } from "../../support/seedData/discussionsForFilteringTests";
import config from "../../../src/config";

describe("Filter discussions by tag", () => {
  beforeEach(function () {
    deleteAll();
    cy.seedUsers();
    cy.seedChannels();
    cy.seedTags();
    // Create discussions with tags referenced in these tests (newYears, trivia)
    cy.createDiscussions(discussionsForFilteringTests);
  });

  const newYearsTagDiscussionTitle = "Test discussion 2";
  const triviaTaggedDiscussionTitle = "Test discussion 3";

  it("in the sitewide online discussions list, filters discussions by tag", () => {
    cy.visit(DISCUSSION_LIST);
    cy.get('div[data-testid="tag-filter-button"]').find("button").click() // open the tag picker

    cy.get('span[data-testid="tag-picker-newYears"]').click(); // click the newYears tag

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);
  });

  Cypress.on("uncaught:exception", (err) => {
    // I don't know what causes this error, but it is only thrown during this test,
    // not when a human uses the tag picker. So I'm suppressing it.
    if (
      err.message.includes(
        "ResizeObserver loop completed with undelivered notifications.",
      )
    ) {
      return false;
    }
    return true; // return true to allow the error to be thrown and fail the test
  });

  it("in the sitewide online discussions list, when filtering by two tags, shows discussions that have at least one of the tags", () => {
    cy.visit(DISCUSSION_LIST);
    cy.get('div[data-testid="tag-filter-button"]').find("button").click(); // open the tag picker

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have two results
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .should("have.length", 2);

    // The expected discussions are in the results
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(triviaTaggedDiscussionTitle);
  });

  const CHANNEL_VIEW =
    `${config.baseUrl}/channels/c/phx_music/discussions/`;

  it("in a channel view, filters discussions by tag", () => {
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW);
    cy.get('div[data-testid="tag-filter-button"]').find("button").click(); // open the tag picker

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have one result
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .contains(searchTerm);
  });

  it("in a channel view, when filtering by two tags, shows discussions that have at least one of the tags", () => {
    cy.visit(CHANNEL_VIEW);
    cy.get('div[data-testid="tag-filter-button"]').find("button").click(); // open the tag picker

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have two results
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .should("have.length", 2);

    // The expected discussions are in the results
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);
    cy.get('ul[data-testid="channel-discussion-list"]')
      .find("li")
      .contains(triviaTaggedDiscussionTitle);
  });
});
