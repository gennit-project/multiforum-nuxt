import { DISCUSSION_LIST } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Comment voting operations", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("User 1 can undo upvote on their own comment", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // Set up GraphQL request interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Intercept specific GraphQL operations
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('createComments')) {
        req.alias = 'createCommentRequest';
      } else if (req.body.query?.includes('upvoteComment') || req.body.query?.includes('Upvote')) {
        req.alias = 'upvoteCommentRequest';
      }
    });

    // User 1 logs in
    cy.loginWithCreateEventButton();

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Click on the first discussion
    cy.get("span").contains("Example topic 1").click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Add a comment
    cy.get("textarea[data-testid='addComment']", { timeout: 10000 })
      .should("be.visible")
      .click();
      
    cy.get("textarea[data-testid='texteditor-textarea']")
      .should("be.visible")
      .type(TEST_COMMENT_TEXT);
      
    cy.get("button").contains("Save").click();
    cy.wait('@createCommentRequest').its('response.statusCode').should('eq', 200);

    // Verify the comment and undo the default upvote that came with the comment
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT);
      
    // Verify the count shows 1  
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .should("be.visible")
      .contains("1");
      
    // Wait for hydration to complete and username to be available
    cy.wait(6000);
    
    // Now click the upvote button directly by data-testid
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .click({force: true});
      
    // Wait outside the 'within' to avoid context restrictions
    cy.wait('@upvoteCommentRequest').its('response.statusCode').should('eq', 200);
    
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT);
      
    // Check the upvote count is now 0
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .should("be.visible")
      .should("contain", "0");
      
    // Toggle upvote again - add back the upvote
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .click({force: true});
      
    // Wait outside the 'within' to avoid context restrictions
    cy.wait('@upvoteCommentRequest').its('response.statusCode').should('eq', 200);
    
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT)
      .within(() => {
        // Check the upvote count is back to 1
        cy.get('button[data-testid="upvote-comment-button"]')
          .should("be.visible")
          .contains("1");
      });
  });

  it("User 2 can upvote another user's comment", () => {
    const TEST_COMMENT_TEXT = "Test comment";

    // Set up GraphQL request interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // Intercept specific GraphQL operations
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body.query?.includes('upvoteComment') || req.body.query?.includes('Upvote')) {
        req.alias = 'upvoteCommentRequest';
      }
    });

    // User 2 logs in
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");
    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    // Go to the discussion list
    cy.visit(DISCUSSION_LIST);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // Navigate to the same discussion
    cy.get("span").contains("Example topic 1").click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // Wait for hydration to complete and username to be available
    cy.wait(6000);
    
    // Upvote the comment as User 2
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT);
      
    // Click the upvote button directly
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .click({force: true});
      
    // Wait outside the 'within' to avoid context restrictions
    cy.wait('@upvoteCommentRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the upvote count increased to 2
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT);
      
    // Verify the count shows 2
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .contains("2");
      
    // Click again to remove the upvote
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .click({force: true});
      
    // Wait outside the 'within' to avoid context restrictions
    cy.wait('@upvoteCommentRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the upvote count decreased back to 1
    cy.get('div[data-testid="comment"]')
      .should("be.visible")
      .and("contain", TEST_COMMENT_TEXT);
      
    // Verify the count shows 1
    cy.get('button[data-testid="upvote-comment-button"]')
      .first()
      .contains("1");
  });
});
