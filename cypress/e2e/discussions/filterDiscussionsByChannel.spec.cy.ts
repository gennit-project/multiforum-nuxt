import { DISCUSSION_LIST } from "../constants";
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Filter discussions by channel", () => {
  // Set up test data once for all tests in this file
  setupTestData();
  // Login before each test
  loginUser('loginWithCreateEventButton');

  it("filters discussions by channel", () => {
    const searchTerm = "Example topic 1";

    cy.visit(DISCUSSION_LIST)
      .wait(3000);
      
    cy.get('button[data-testid="forum-filter-button"]')
      .click(); // open the channel picker

    cy.get('span[data-testid="forum-picker-cats"]').click(); // click the cats channel

    // should have one result
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 1);

    // top result contains the search term
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").contains(searchTerm);
    
    // click the phx_music tag
    cy.get('span[data-testid="forum-picker-phx_music"]').click();
    
    // should have three results
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 3);

    // Un-filter by cats
    cy.get('span[data-testid="forum-picker-cats"]').click();

    // should have two results
    cy.get('ul[data-testid="sitewide-discussion-list"]').find("li").should("have.length", 2);
  });
});
