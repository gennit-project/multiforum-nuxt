import { DISCUSSION_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Filter discussions by text", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
  });

  it("in the sitewide online discussions list, filters discussions by text", () => {
    const searchTerm = "topic 1";

    cy.visit(DISCUSSION_LIST)
      .wait(3000);
    cy.get('div[data-testid="discussion-filter-search-bar"]')
      .find("input")
      .type(`${searchTerm}{enter}`)
     

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, filters discussions by text", () => {
    const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/discussions/`
    const searchTerm = "topic 3";

    cy.visit(CHANNEL_VIEW)
      .wait(3000);

    cy.get('div[data-testid="discussion-filter-search-bar"]')
      .find("input")
      .type(`${searchTerm}{enter}`)

    // should have one result
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="channel-discussion-list"]').find("li").contains(searchTerm);
  });
});
