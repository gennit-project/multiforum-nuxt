import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Filter discussions by tag", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.loginWithCreateEventButton();
  });

  const newYearsTagDiscussionTitle = "Example topic 2";
  const triviaTaggedDiscussionTitle = "Example topic 3";

  it("in the sitewide online discussions list, filters discussions by tag", () => {
    cy.visit(DISCUSSION_LIST).wait(3000);
    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

    cy.get('span[data-testid="tag-picker-newYears"]').click(); // click the newYears tag

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]')
      .find("li")
      .contains(newYearsTagDiscussionTitle);

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

  it("in a channel view, filters discussions by tag", () => {
    const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/discussions/`;
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW).wait(3000);
    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

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

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();

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
