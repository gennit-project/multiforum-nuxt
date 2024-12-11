import { ONLINE_EVENT_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Filter events by tag", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
  });

  const newYearsTagEventTitle = "Test online event in phx_music";
  const triviaTaggedEventTitle = "Test event with a trivia tag";

  // THIS WORKS
  it("in the sitewide online events list, filters events by tag", () => {
    cy.visit(ONLINE_EVENT_LIST).wait(3000);

    cy.get('button[data-testid="tag-filter-button"]').click();

    cy.get('span[data-testid="tag-picker-newYears"]').click(); // click the newYears tag

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(newYearsTagEventTitle);
  });

  it("in the sitewide online events list, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST).wait(3000);

    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have two results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 2);

    // The expected events are in the results
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(newYearsTagEventTitle);
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(triviaTaggedEventTitle);
  });

  const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/events/`;


  it("in a channel view, filters events by tag", () => {
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW)
      .wait(1500);
    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });


  it("in a channel view, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(CHANNEL_VIEW)
      .wait(1500);
    cy.get('button[data-testid="tag-filter-button"]').click(); // open the tag picker

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have two results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 2);

    // The expected events are in the results
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(newYearsTagEventTitle);
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(triviaTaggedEventTitle);
  });
});
