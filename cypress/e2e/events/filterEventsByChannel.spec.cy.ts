import { ONLINE_EVENT_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Filter events by channel", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("filters events by channel", () => {
    const searchTerm = "Test free/virtual event";

    cy.visit(ONLINE_EVENT_LIST)
      .wait(3000); // Wait for hydration so buttons become functional

    cy.get('button[data-testid="forum-filter-button"]')
      .should('be.visible')
      .first() // Expect elements to appear twice because we use CSS for showing and hiding
      // based on screen width, which is probably the best and easiest way to prevent content 
      // shift after SSR.
      .click();

    cy.get('span[data-testid="forum-picker-cats"]')
      .should('be.visible')
      .first()
      .click();

    // should have one result
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="event-list"]').find("li").contains(searchTerm);
  });

  it("when filtering by two tags, shows events that have at least one of the tags", () => {
    cy.visit(ONLINE_EVENT_LIST)
    .wait(3000);

    // open the channel picker
    cy.get('button[data-testid="forum-filter-button"]')
      .should('be.visible')
      .first()
      .click()

    // click the cats tag
    cy.get('span[data-testid="forum-picker-cats"]')
      .should('be.visible')
      .first()
      .click();

    // click the phx_music tag
    cy.get('span[data-testid="forum-picker-phx_music"]')
      .should('be.visible')
      .first()
      .click();

    // should have three results
    cy.get('ul[data-testid="event-list"]').find("li").should("have.length", 10);
  });
});
