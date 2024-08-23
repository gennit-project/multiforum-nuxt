import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";
import { discussionsForFilteringTests } from "../../support/seedData/discussionsForFilteringTests";
import config from "../../../src/config";

describe("Filter discussions by text", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.createDiscussions(discussionsForFilteringTests);
  });

  it("in the sitewide online discussions list, filters discussions by text", () => {
    const searchTerm = "cats";

    cy.visit(DISCUSSION_LIST);
    cy.get('div[data-testid="discussion-filter-search-bar"]')
      .find("input")
      .type(`${searchTerm}{enter}`);

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, filters discussions by text", () => {
    const CHANNEL_VIEW = `${config.baseUrl}/channels/c/phx_music/discussions/`
    const searchTerm = "discussion 3";

    cy.visit(CHANNEL_VIEW);
    cy.get('div[data-testid="discussion-filter-search-bar"]')
      .find("input")
      .type(`${searchTerm}{enter}`);

    // should have one result
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").contains(searchTerm);
  });
});
