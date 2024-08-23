import { DISCUSSION_LIST } from "../constants";
import { deleteAll } from "../utils";
import { discussionsForFilteringTests } from "../../support/seedData/discussionsForFilteringTests";

describe("Filter discussions by channel", () => {
  beforeEach(function () {
    deleteAll();
    cy.seedUsers();
    cy.seedChannels();
    cy.seedTags();
     // Create discussions with channels referenced in these tests (cats, phx_music)
     cy.createDiscussions(discussionsForFilteringTests);
  });

  it("filters discussions by channel", () => {
    const searchTerm = "Test discussion 1, about cats";

    cy.visit(DISCUSSION_LIST);
    cy.get('div[data-testid="channel-filter-button"]').find("button").click(); // open the channel picker

    cy.get('span[data-testid="channel-picker-cats"]').click(); // click the cats channel

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").contains(searchTerm);
  });

  it("when filtering by two tags, shows discussions that have at least one of the tags", () => {
    cy.visit(DISCUSSION_LIST);

    // open the channel picker
    cy.get('div[data-testid="channel-filter-button"]').find("button").click();

    // click the cats tag
    cy.get('span[data-testid="channel-picker-cats"]').click();

    // click the phx_music tag
    cy.get('span[data-testid="channel-picker-phx_music"]').click();

    // should have three results
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 3);
  });
});
