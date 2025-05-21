import { ONLINE_EVENT_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Filter events by tag", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  const newYearsTagEventTitle = "Test online event in phx_music";
  const triviaTaggedEventTitle = "Test event with a trivia tag";

  beforeEach(() => {
    // Intercept GraphQL requests
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("events")) {
        req.alias = "getEventsRequest";
      }
    });
  });

  it("in the sitewide online events list, filters events by tag", () => {
    cy.visit(ONLINE_EVENT_LIST);
    // Wait for initial data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="tag-filter-button"]')
      .should("be.visible")
      .first() // Get the first button in case there are multiple buttons with the same data-testid
      .click();

    cy.get('span[data-testid="tag-picker-newYears"]').should("be.visible").first().click();

    // Wait for filtered events to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(newYearsTagEventTitle);
  });

  it("in the sitewide online events list, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST);
    // Wait for initial data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="tag-filter-button"]').should("be.visible").first().click();

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').should("be.visible").first().click();

    // Wait for first tag filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').should("be.visible").first().click();

    // Wait for second tag filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // should have two results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 2);

    // The expected events are in the results
    cy.get('ul[data-testid="event-list"]').find("li").contains(newYearsTagEventTitle);
    cy.get('ul[data-testid="event-list"]').find("li").contains(triviaTaggedEventTitle);
  });

  const CHANNEL_VIEW = `${Cypress.env("baseUrl")}/forums/phx_music/events/`;

  it("in a channel view, filters events by tag", () => {
    const searchTerm = "trivia";

    cy.visit(CHANNEL_VIEW);
    // Wait for initial data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="toggle-main-filters-button"]').click();
    cy.get('button[data-testid="tag-filter-button"]').should("be.visible").first().click();

    // scroll up
    cy.scrollTo("top");
    // in data-testid="tags-input", type trivia
    cy.get('input[data-testid="tags-input"]').should("be.visible").first().type(searchTerm);

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').should("be.visible").first().click();

    // Wait for tag filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("in a channel view, when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(CHANNEL_VIEW);
    // Wait for initial data to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="toggle-main-filters-button"]').click();
    cy.get('button[data-testid="tag-filter-button"]').should("be.visible").first().click();

    // click the newYears tag
    cy.get('span[data-testid="tag-picker-newYears"]').should("be.visible").first().click();

    // Wait for first tag filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // click the trivia tag
    cy.get('span[data-testid="tag-picker-trivia"]').should("be.visible").first().click();

    // Wait for second tag filter to apply
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // should have two results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 2);

    // The expected events are in the results
    cy.get('ul[data-testid="event-list"]').find("li").contains(newYearsTagEventTitle);
    cy.get('ul[data-testid="event-list"]').find("li").contains(triviaTaggedEventTitle);
  });
});
