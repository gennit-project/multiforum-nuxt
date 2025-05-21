import { CATS_FORUM_EVENTS } from "../constants";
import { setupTestData } from "../../support/testSetup";

describe("Give feedback on an event", () => {
  // Set up test data once for all tests in this file
  setupTestData();

  beforeEach(() => {
    // Intercept GraphQL requests
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query?.includes("events")) {
        req.alias = "getEventsRequest";
      } else if (req.body.query?.includes("createFeedback")) {
        req.alias = "createFeedbackRequest";
      } else if (req.body.query?.includes("updateComment")) {
        req.alias = "updateCommentRequest";
      } else if (req.body.query?.includes("deleteComment")) {
        req.alias = "deleteCommentRequest";
      } else if (req.body.query?.includes("event(")) {
        req.alias = "getEventRequest";
      } else if (req.body.query?.includes("comments")) {
        req.alias = "getCommentsRequest";
      }
    });
  });

  it("can create/edit/delete feedback and permalink to it", () => {
    const EDITED_FEEDBACK = "This is an edited test feedback";
    const targetEventTitle = "Test free/virtual event";
    const username2 = Cypress.env("auth0_username_2");
    const password2 = Cypress.env("auth0_password_2");

    // For the feedback buttons to be visible we need to be logged in as
    // someone who did not create the event.
    cy.loginWithCreateEventButton({
      username: username2,
      password: password2,
    });

    cy.visit(CATS_FORUM_EVENTS);
    // Wait for events to load
    cy.wait("@getEventsRequest").its("response.statusCode").should("eq", 200);

    // Wait for list to be visible and click the event
    cy.get('ul[data-testid="event-list"]').should("be.visible");
    cy.get("span").contains(targetEventTitle).click();

    // Wait for event details to load
    // cy.wait('@getEventRequest').its('response.statusCode').should('eq', 200);
    cy.url().should("include", "/events/");

    // Now interact with elements on the new page
    cy.get('button[data-testid="event-menu-button"]').should("be.visible").click();

    cy.get('div[data-testid="event-menu-button-item-Give Feedback"]')
      .should("be.visible")
      .first()
      .click();

    // CREATE FEEDBACK
    // In the textarea called with the data-testid="description-input" attribute, type "This is a test feedback"
    cy.get('textarea[data-testid="description-input"]').type("This is a test feedback");
    // click submit
    cy.get('button[data-testid="feedback-form-modal-primary-button"]').click();

    // Wait for create feedback request to complete
    cy.wait("@createFeedbackRequest").its("response.statusCode").should("eq", 200);

    // EDIT FEEDBACK
    // To edit event feedback, which is less prominent
    // than discussion feedback we have to do it from the feedback page.
    cy.get('button[data-testid="add-to-calendar-button"]').should("be.visible").click();

    cy.get('button[data-testid="event-menu-button"]').should("be.visible").click();

    cy.get('div[data-testid="event-menu-button-item-View Feedback"]')
      .should("be.visible")
      .first()
      .click();

    // Wait for comments to load
    cy.wait("@getCommentsRequest").its("response.statusCode").should("eq", 200);

    cy.get('button[data-testid="feedback-comment-menu"]').should("be.visible").click();
    cy.get('div[data-testid="feedback-comment-menu-item-Edit"]')
      .should("be.visible")
      .first()
      .click();

    // In the textarea called with the data-testid="description-input" attribute, type "This is an edited test feedback"
    cy.get('textarea[data-testid="texteditor-textarea"]')
      .should("be.visible")
      .type(EDITED_FEEDBACK);
    // click submit
    cy.get('button[data-testid="saveCommentButton"]').click();

    // Wait for update request to complete
    cy.wait("@updateCommentRequest").its("response.statusCode").should("eq", 200);

    // confirm that the feedback is displayed
    cy.get("p").contains(EDITED_FEEDBACK).should("be.visible");

    // go back - just making sure the back link works
    cy.get('a[data-testid="event-detail-back-link"]').click();

    // confirm that you can still see the target event title
    cy.get("h2").contains(targetEventTitle).should("be.visible");

    // go to feedback page again, this time to get the permalink
    cy.get('button[data-testid="event-menu-button"]').should("be.visible").click();

    cy.get('div[data-testid="event-menu-button-item-View Feedback"]')
      .should("be.visible")
      .first()
      .click();

    // Wait for comments to load
    cy.wait("@getCommentsRequest").its("response.statusCode").should("eq", 200);

    cy.writeClipboardText(); // Set up the clipboard interception
    cy.get('button[data-testid="feedback-comment-menu"]').should("be.visible").click();
    cy.get('div[data-testid="feedback-comment-menu-item-Copy Link"]')
      .should("be.visible")
      .first()
      .click();

    // Visit the link that is now copied to the clipboard
    // Get the copied link from clipboard and visit it
    cy.getClipboardText().then((text) => {
      cy.visit(text);

      // Wait for comments to load on permalink page
      cy.wait("@getCommentsRequest").its("response.statusCode").should("eq", 200);

      cy.get("p").contains(EDITED_FEEDBACK).should("exist");
      cy.get("span").contains("Permalinked").should("exist");
    });

    // Finally, test the deletion of feedback
    cy.get('button[data-testid="feedback-comment-menu"]').should("be.visible").click();
    cy.get('div[data-testid="feedback-comment-menu-item-Delete"]')
      .should("be.visible")
      .first()
      .click();

    // Click delete to confirm in the modal
    cy.get('button[data-testid="delete-comment-modal-primary-button"]')
      .should("be.visible")
      .click();

    // Wait for delete request to complete
    cy.wait("@deleteCommentRequest").its("response.statusCode").should("eq", 200);

    // There should now be a paragraph that says "Comment not found"
    cy.get("p").contains("Comment not found").should("exist");
  });
});
