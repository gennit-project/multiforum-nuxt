import type { EventCreateInputWithChannels } from "./events";
import events from "./events";

const createEvents = (events: EventCreateInputWithChannels[]) => {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const mutation = `
      mutation createEvent(
        $eventCreateInput: EventCreateInput
        $channelConnections: [String]
      ) {
        createEventWithChannelConnections(
          eventCreateInput: $eventCreateInput
          channelConnections: $channelConnections
        ) {
          id
          title
          description
          startTime
          startTimeDayOfWeek
          startTimeHourOfDay
          endTime
          locationName
          address
          virtualEventUrl
          startTimeDayOfWeek
          canceled
          location {
            latitude
            longitude
          }
          cost
          EventChannels {
            id
            Channel {
              uniqueName
            }
          }
          Poster {
            username
          }
          createdAt
          updatedAt
          Tags {
            text
          }
        }
      }
    `;

    cy.authenticatedGraphQL(mutation, {
      eventCreateInput: event.eventCreateInput,
      channelConnections: event.channelConnections,
    }).then((response: any) => {
      // Add error handling
      if (response.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(response.errors)}`);
      }
    });
  }
};


const seedEvents = () => {
  createEvents(events)
};

export default seedEvents;
