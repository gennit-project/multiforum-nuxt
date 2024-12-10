import { ONLINE_EVENT_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Filter events by channel", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
  });

  it("filters events by channel", () => {
    const searchTerm = "Test free/virtual event";

    cy.visit(ONLINE_EVENT_LIST);
    cy.get('button[data-testid="forum-filter-button"]').click(); // open the channel picker

    cy.get('span[data-testid="channel-picker-cats"]').click(); // click the cats channel

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST);

    // open the channel picker
    cy.get('button[data-testid="forum-filter-button"]').click();

    // click the cats tag
    cy.get('span[data-testid="channel-picker-cats"]').click();

    // click the phx_music tag
    cy.get('span[data-testid="channel-picker-phx_music"]').click();

    // should have three results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 3);
  });
});
