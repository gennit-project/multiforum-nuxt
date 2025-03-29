import { deleteAll, seedAll } from "../utils";
import { ONLINE_EVENT_LIST } from "../constants";

describe("Filter events by text", () => {
  it("should filter events by time period correctly", () => {
    // Initial setup - only runs once
    deleteAll();
    seedAll();
    cy.visit(ONLINE_EVENT_LIST)
      .wait(5000); // Wait for hydration so buttons become functional

    // wait for event list to load before testing filters
    cy.get('ul[data-testid="event-list"]').should("exist");

    // Test today's events
    cy.get(`span[data-testid=time-shortcut-Today]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("Today").should("exist");
        cy.get('ul[data-testid="event-list"]').find("li").contains("Tomorrow").should("not.exist");
      });

    // Test tomorrow's events
    cy.get(`span[data-testid=time-shortcut-Tomorrow]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("Tomorrow");
        cy.get('ul[data-testid="event-list"]')
          .find("li")
          .contains("Today")
          .should("not.exist");
      });

    // Test this weekend's events
    cy.get(`span[data-testid="time-shortcut-This weekend"]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("This Weekend");
        cy.get('ul[data-testid="event-list"]')
          .find("li")
          .contains("Next Weekend")
          .should("not.exist");
      });

    // Test next week's events
    cy.get(`span[data-testid="time-shortcut-Next week"]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("Next Week");
        cy.get('ul[data-testid="event-list"]')
          .find("li")
          .contains("This Weekend")
          .should("not.exist");
      });

    // Test next weekend's events
    cy.get(`span[data-testid="time-shortcut-Next weekend"]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("Next Weekend");
        cy.get('ul[data-testid="event-list"]')
          .find("li")
          .contains("This Weekend")
          .should("not.exist");
      });

    // Test this month's events
    cy.get(`span[data-testid="time-shortcut-This month"]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("This Month");
      });

    // Test past events
    cy.get(`span[data-testid="time-shortcut-Past events"]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("Past");
        cy.get('ul[data-testid="event-list"]')
          .find("li")
          .contains("This Month")
          .should("not.exist");
      });

    // Test next month's events
    cy.get(`span[data-testid="time-shortcut-Next month"]`)
      .click()
      .then(() => {
        cy.get('ul[data-testid="event-list"]').find("li").contains("Next Month");
        cy.get('ul[data-testid="event-list"]')
          .find("li")
          .contains("This Month")
          .should("not.exist");
      });
  });
});