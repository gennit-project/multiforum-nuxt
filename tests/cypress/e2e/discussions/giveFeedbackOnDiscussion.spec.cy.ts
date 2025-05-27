import { CATS_FORUM } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Give feedback on a discussion", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  it("can create/edit/delete feedback and permalink to it", () => {
    const EDITED_FEEDBACK = "This is an edited test feedback";
    const targetDiscussionTitle = "Example topic 1";
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");
    
    // Set up network interception for GraphQL requests
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
    
    // For the feedback buttons to be visible we need to be logged in as
    // someone who did not create the event.
    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    cy.visit(CATS_FORUM);
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    cy.get("span").contains(targetDiscussionTitle).click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    cy.get('button[data-testid="downvote-discussion-button"]').click();
    
    cy.get(
      'div[data-testid="discussion-thumbs-down-menu-button-item-Give Feedback"]'
    )
      // click the first of multiple matching elements
      .first()
      .click();

    // CREATE FEEDBACK
    // In the textarea called with the data-testid="description-input" attribute, type "This is a test feedback"
    cy.get('textarea[data-testid="description-input"]').type(
      "This is a test feedback"
    );
    // click submit
    cy.get('button[data-testid="feedback-form-modal-primary-button"]').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // confirm that the downvote-discussion-button now has the class bg-blue-500
    cy.get('button[data-testid="downvote-discussion-button"]').should(
      "have.class",
      "bg-blue-500"
    );

    // EDIT FEEDBACK
    cy.get('button[data-testid="downvote-discussion-button"]').click();
    
    cy.get(
      'div[data-testid="discussion-thumbs-down-menu-button-item-Edit Feedback"]'
    )
      .first()
      .click();
    
    // In the textarea called with the data-testid="description-input" attribute, type "This is an edited test feedback"
    cy.get('textarea[data-testid="texteditor-textarea"]').type(EDITED_FEEDBACK);
    // click submit
    cy.get('button[data-testid="edit-feedback-modal-primary-button"]').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
    
    // go to feedback page
    cy.get('button[data-testid="downvote-discussion-button"]').click();
    cy.get(
      'div[data-testid="discussion-thumbs-down-menu-button-item-View Feedback"]'
    )
      .first()
      .click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // confirm that the feedback is displayed
    cy.get("p").contains(EDITED_FEEDBACK);

    // go back - just making sure the back link works
    cy.get('a[data-testid="discussion-detail-back-link"]').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // confirm that you can still see the target discussion title
    cy.get("h2").contains(targetDiscussionTitle);

    // go to feedback page again, this time to get the permalink
    cy.get('button[data-testid="downvote-discussion-button"]').click();
    
    cy.get('div[data-testid="discussion-thumbs-down-menu-button-item-View Feedback"]')
      .first()
      .click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.writeClipboardText();  // Set up the clipboard interception
    cy.get('button[data-testid="feedback-comment-menu"]').click();
    cy.get('div[data-testid="feedback-comment-menu-item-Copy Link"]')
      .first()
      .click();

    // Visit the link that is now copied to the clipboard
    // Get the copied link from clipboard and visit it
    cy.getClipboardText().then((text) => {
      cy.visit(text);
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
      cy.get("p").contains(EDITED_FEEDBACK).should("exist");
      cy.get("span").contains("Permalinked").should("exist");
    });

    // Finally, test the deletion of feedback
    cy.get('button[data-testid="feedback-comment-menu"]').click();
    cy.get('div[data-testid="feedback-comment-menu-item-Delete"]')
      .first()
      .click();
    // Click delete to confirm in the modal
    cy.get('button[data-testid="delete-comment-modal-primary-button"]').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // There should now be a paragraph that says "Comment not found"
    cy.get("p").contains("Comment not found").should("exist");

    cy.get('a[data-testid="discussion-detail-back-link"]').click();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    //confirm that the downvote-discussion-button now does NOT have the class bg-blue-500
    cy.get('button[data-testid="downvote-discussion-button"]').should(
      "not.have.class",
      "bg-blue-500"
    );
  });
});