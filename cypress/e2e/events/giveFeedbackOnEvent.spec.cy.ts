import { CATS_FORUM_EVENTS } from "../constants";
import { deleteAll, seedAll } from "../utils";

describe("Give feedback on an event", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
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

    cy.visit(CATS_FORUM_EVENTS).wait(3000);
    cy.get("span").contains(targetEventTitle).click();
    cy.get('button[data-testid="event-menu-button"]')
      .click()
      .wait(1000);
    cy.get(
      'div[data-testid="event-menu-button-item-Give Feedback"]'
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

        // EDIT FEEDBACK
        // To edit event feedback, which is less prominent
        // than discussion feedback we have to do it from the feedback page.
        cy.get('button[data-testid="event-menu-button"]')
        .click()
        .wait(1000);
        cy.get(
          'div[data-testid="event-menu-button-item-View Feedback"]'
        )
        .first()
        .click()
        .wait(1000);

    cy.get('button[data-testid="feedback-comment-menu"]').click();
    cy.get('div[data-testid="feedback-comment-menu-item-Edit"]')
      .first()
      .click();

    // In the textarea called with the data-testid="description-input" attribute, type "This is an edited test feedback"
    cy.get('textarea[data-testid="texteditor-textarea"]').type(EDITED_FEEDBACK);
    // click submit
    cy.get('button[data-testid="saveCommentButton"]').click().wait(1000);

    // confirm that the feedback is displayed
    cy.get("p").contains(EDITED_FEEDBACK);

    // go back - just making sure the back link works
    cy.get('a[data-testid="event-detail-back-link"]').click();

    // confirm that you can still see the target event title
    cy.get("h2").contains(targetEventTitle);

    // go to feedback page again, this time to get the permalink
    cy.get('button[data-testid="event-menu-button"]')
      .click()
      .wait(1000);
    cy.get('div[data-testid="event-menu-button-item-View Feedback"]')
      .first()
      .click()
      .wait(1500);

      cy.writeClipboardText();  // Set up the clipboard interception
    cy.get('button[data-testid="feedback-comment-menu"]').click();
    cy.get('div[data-testid="feedback-comment-menu-item-Copy Link"]')
      .first()
      .click();

    // Visit the link that is now copied to the clipboard
    // Get the copied link from clipboard and visit it
    cy.getClipboardText().then((text) => {
      cy.visit(text)
        .wait(3000);
      cy.get("p").contains(EDITED_FEEDBACK).should("exist");
      cy.get("span").contains("Permalinked").should("exist");
    });

    // Finally, test the deletion of feedback
    cy.get('button[data-testid="feedback-comment-menu"]').click()
    cy.get('div[data-testid="feedback-comment-menu-item-Delete"]')
      .first()
      .click();
    // Click delete to confirm in the modal
    cy.get('button[data-testid="delete-comment-modal-primary-button"]').click();

    // There should now be a paragraph that says "Comment not found"
    cy.get("p").contains("Comment not found").should("exist");
  });
});
