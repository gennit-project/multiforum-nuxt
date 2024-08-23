import { IN_PERSON_EVENT_LIST } from "../constants";
import { deleteAll, seedAll } from "../utils";
import eventsForFilteringTests from "../../support/seedData/eventsForFilteringTests";

describe("Map markers work", () => {
  beforeEach(function () {
    deleteAll();
    seedAll();
    cy.createEvents(eventsForFilteringTests);
  });

  it("in the sitewide in-person events list, map markers are functional", () => {
    // Go to the map view.
    cy.visit(IN_PERSON_EVENT_LIST);

    // Hovering on list item "Selena Night" makes map marker open.
    cy.get('ul[data-testid="event-list"]')
      .find("span")
      .contains("Selena Night")
      .trigger("mouseover");

    // Listen for custom event to validate that the info window is open
    // on the map and it says the event title and location.
    cy.window().then((win) => {
      win.addEventListener("SpecificInfoWindowOpen", (event) => {
        // Validate that InfoWindow is open
        expect(event.detail?.eventTitle).to.equal("Selena Night");
        expect(event.detail?.eventLocation).to.equal("Crescent Ballroom");
      });
    });

    /* I would like to test the following as well:

        - hovering on map marker makes list item highlighted
        - clicking map marker opens preview of one event
        - clicking map marker of multiple events in same place opens a list of multiple events
        - clicking one of those items opens preview of single event - check if description of event is visible

        But unfortunately it is very difficult to test these things with Cypress.
        The map markers are in an iFrame so we can't access them with Cypress.

        The only way to trigger the list item to be highlighted, for instance,
        is if we have the event ID and event location coordinates. But those
        numbers are not in the UI, so we can't get them with Cypress.
    */
  });
});
