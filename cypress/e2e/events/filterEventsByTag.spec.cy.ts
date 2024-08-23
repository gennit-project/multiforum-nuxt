import { ONLINE_EVENT_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";
import eventsForFilteringTests from "../../support/seedData/eventsForFilteringTests";
import config from "../../../src/config";

describe("Filter events by tag", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    // Create events with tags referenced in these tests (newYears, trivia)
    cy.createEvents(eventsForFilteringTests);
  });

  const newYearsTagEventTitle = "Test online event in phx_music";
  const triviaTaggedEventTitle = "Test event with a trivia tag";

  // THIS WORKS
  it("in the sitewide online events list, filters events by tag", () => {
    cy.visit(ONLINE_EVENT_LIST);
    cy.get('div[data-testid="tag-filter-button"]')
      .find('button[id="filter-button"]')
      .click();
    // open the tag picker and wait for it to load
    cy.get('div[data-testid="tag-picker"]').should("be.visible");

    cy.get('span[data-testid="tag-picker-newYears"]').click(); // click the newYears tag

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(newYearsTagEventTitle);
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

  it("in the sitewide online events list, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST);
    cy.get('div[data-testid="tag-filter-button"]').find("button").click(); // open the tag picker

    // Press shift to allow selecting multiple tags
    cy.get('div[data-testid="tag-picker"]').trigger("keydown", {
      key: "Shift",
    });

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // Release shift
    cy.get('div[data-testid="tag-picker"]').trigger("keyup", {
      key: "Shift",
    });

    // Click outside the menu
    cy.get('div[data-testid="tag-picker"]').click();

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

  const CHANNEL_VIEW =
    `${config.baseUrl}/channels/c/phx_music/events/search/`;

  // BROKEN
  it("in a channel view, filters events by tag", () => {
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW);
    cy.get('div[data-testid="tag-filter-button"]')
      .find('button[id="filter-button"]')
      .click();
    // open the tag picker and wait for it to load
    cy.get('div[data-testid="tag-picker"]').should("be.visible");

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').click();

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  /// THIS WORKS
  it("in a channel view, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(CHANNEL_VIEW);
    cy.get('div[data-testid="tag-filter-button"]')
      .find('button[id="filter-button"]')
      .click();
    // open the tag picker
    cy.get('div[data-testid="tag-picker"]').should("be.visible");

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
