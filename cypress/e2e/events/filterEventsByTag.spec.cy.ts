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

    cy.get('button[data-testid="tag-filter-button"]')
      .should('be.visible')
      .first() // Expect elements to appear twice because we use CSS for showing and hiding
      // based on screen width, which is probably the best and easiest way to prevent content 
      // shift after SSR.
      .click();

    cy.get('span[data-testid="tag-picker-newYears"]')
      .should('be.visible')
      .first()
      .click();

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains(newYearsTagEventTitle);
  });

  it("in the sitewide online events list, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST).wait(3000);

    cy.get('button[data-testid="tag-filter-button"]')
      .should('be.visible')
      .first()
      .click();

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]')
      .should('be.visible')
      .first()
      .click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]')
      .should('be.visible')
      .first()
      .click();

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

    cy.visit(CHANNEL_VIEW).wait(1500);
    cy.get('button[data-testid="toggle-main-filters-button"]').click();
    cy.get('button[data-testid="tag-filter-button"]')
      .should('be.visible')
      .first()
      .click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]')
      .should('be.visible')
      .first()
      .click();

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(CHANNEL_VIEW).wait(1500);
    cy.get('button[data-testid="toggle-main-filters-button"]').click();
    cy.get('button[data-testid="tag-filter-button"]').click()
      .should('be.visible')
      .first()
      .click();

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]')
      .should('be.visible')
      .first()
      .click();

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]')
      .should('be.visible')
      .first()
      .click();

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
