import { timeShortcutValues } from "../../../src/components/event/list/filters/eventSearchOptions";
import { DateTime } from "luxon";
import { deleteAll } from "../utils";
import { ONLINE_EVENT_LIST } from "../constants";
import { EventCreateInputWithChannels } from "../../support/seedData/events";

// For each time shortcut, we want to test that the correct events are shown.
// First generate test events for each time shortcut.
const timeZone = Cypress.env("TZ");
const now = DateTime.now().setZone(timeZone);

const getStartOfThisWeekend = () => {
  const startOfWeek = now.startOf("week");
  return startOfWeek.plus({ days: 5 });
};

const getStartOfNextWeek = () => {
  const startOfThisWeek = now.startOf("week");
  // If today is Sunday, look for events after
  // the following Sunday
  return startOfThisWeek.plus({ weeks: 1 });
};
const startOfThisWeekend = getStartOfThisWeekend();
const startOfNextWeek = getStartOfNextWeek();
const startOfThisMonth = now.startOf("month");

type TestEventData = {
  timeShortcut: string;
  id: string;
  start: string;
  end: string;
  name: string;
};

const testEventData: TestEventData[] = [
  {
    id: "today",
    start: DateTime.now().toISO(),
    end: DateTime.now().endOf("day").toISO(),
    name: "Today",
    timeShortcut: timeShortcutValues.TODAY,
  },
  {
    id: "tomorrow",
    start: DateTime.now().plus({ days: 1, minutes: 1 }).toISO(),
    end: DateTime.now().plus({ days: 2 }).toISO(),
    name: "Tomorrow",
    timeShortcut: timeShortcutValues.TOMORROW,
  },
  {
    id: "this-weekend",
    start: startOfThisWeekend.plus({ minutes: 1 }).toISO(),
    end: startOfThisWeekend.plus({ days: 2 }).toISO(),
    name: "This weekend",
    timeShortcut: timeShortcutValues.THIS_WEEKEND,
  },
  {
    id: "next-week",
    start: startOfNextWeek.plus({ minutes: 1 }).toISO(),
    end: startOfNextWeek.plus({ weeks: 1 }).toISO(),
    name: "Next week",
    timeShortcut: timeShortcutValues.NEXT_WEEK,
  },
  {
    id: "next-weekend",
    start: startOfNextWeek.plus({ days: 5, minutes: 1 }).toISO(),
    end: startOfNextWeek.plus({ weeks: 1 }).toISO(),
    name: "Next Weekend",
    timeShortcut: timeShortcutValues.NEXT_WEEKEND,
  },
  {
    id: "this-month",
    start: now.toISO(),
    end: startOfThisMonth.plus({ months: 1, minutes: 1 }).toISO(),
    name: "This Month",
    timeShortcut: timeShortcutValues.THIS_MONTH,
  },
  {
    id: "past",
    start: now.minus({ years: 1 }).toISO(),
    end: now.startOf("day").toISO(),
    name: "Past",
    timeShortcut: timeShortcutValues.PAST_EVENTS,
  },
  {
    id: "next-month",
    start: startOfThisMonth.plus({ months: 1, minutes: 1 }).toISO(),
    end: startOfThisMonth.plus({ months: 2 }).toISO(),
    name: "Next Month",
    timeShortcut: timeShortcutValues.NEXT_MONTH,
  },
];

// Map test data to EventCreateInput objects
const mapTestDataToGraphQLInput = (
  events: TestEventData[],
): EventCreateInputWithChannels[] => {
  return events.map((event: TestEventData) => {
    return {
      eventCreateInput: {
        title: event.name,
        startTime: event.start,
        endTime: event.end,
        virtualEventUrl: "https://example.com",
        Poster: {
          connect: {
            where: {
              node: {
                username: "cluse",
              },
            },
          },
        },
        cost: "0",
        canceled: false,
      },
      channelConnections: ["phx_music"],
    };
  });
};

describe("Filter events by text", () => {
  beforeEach(function () {
    deleteAll();
    cy.seedUsers();
    cy.seedChannels();

    cy.createEvents(mapTestDataToGraphQLInput(testEventData));
    cy.visit(ONLINE_EVENT_LIST);

    // wait for event list to load before testing filters
    cy.get('ul[data-testid="event-list"]').should("exist");
  });

  it("should show events for today", () => {
    cy.get(`span[data-testid=time-shortcut-Today`).click();

    // Expect the results to contain an event named Today
    cy.get('ul[data-testid="event-list"]').find("li").contains("Today");

    // The results should not contain the event named Tomorrow
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("Tomorrow")
      .should("not.exist");
  });

  it("should show events for tomorrow", () => {
    cy.get(`span[data-testid=time-shortcut-Tomorrow`).click();

    // Expect the results to contain an event named Tomorrow
    cy.get('ul[data-testid="event-list"]').find("li").contains("Tomorrow");

    // The results should not contain the event named Today
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("Today")
      .should("not.exist");
  });

  it("should show events for this weekend", () => {
    cy.get(`span[data-testid="time-shortcut-This weekend"`).click();

    // Expect the results to contain an event named This Weekend
    cy.get('ul[data-testid="event-list"]').find("li").contains("This weekend");

    // The results should not contain the event named Next Weekend
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("Next Weekend")
      .should("not.exist");
  });

  it("should show events for next week", () => {
    cy.get(`span[data-testid="time-shortcut-Next week"`).click();

    // Expect the results to contain an event named Next Week
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next week");

    // The results should not contain the event named This Weekend
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("This Weekend")
      .should("not.exist");
  });

  it("should show events for next weekend", () => {
    cy.get(`span[data-testid="time-shortcut-Next weekend"`).click();

    // Expect the results to contain an event named Next Weekend
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next Weekend");

    // The results should not contain the event named This Weekend
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("This Weekend")
      .should("not.exist");
  });

  it("should show events for this month", () => {
    cy.get(`span[data-testid="time-shortcut-This month"`).click();

    // Expect the results to contain an event named This Month
    cy.get('ul[data-testid="event-list"]').find("li").contains("This Month");

    // The results should not contain the event named Next Month
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("Past")
      .should("not.exist");
  });

  it("should show events for past", () => {
    cy.get(`span[data-testid="time-shortcut-Past events"`).click();

    // Expect the results to contain an event named Past
    cy.get('ul[data-testid="event-list"]').find("li").contains("Past");

    // The results should not contain the event named This Month
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("This Month")
      .should("not.exist");
  });

  it("should show events for next month", () => {
    cy.get(`span[data-testid="time-shortcut-Next month"`).click();

    // Expect the results to contain an event named Next Month
    cy.get('ul[data-testid="event-list"]').find("li").contains("Next Month");

    // The results should not contain the event named This Month
    cy.get('ul[data-testid="event-list"]')
      .find("li")
      .contains("This Month")
      .should("not.exist");
  });
});
