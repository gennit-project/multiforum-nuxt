
import { EventCreateInputWithChannels } from "../seedData/events";

const createEvents = (events: EventCreateInputWithChannels[]) => {
  const getOperation = (event: EventCreateInputWithChannels) => {
    return {
      query: `
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
      `,
      variables: {
        eventCreateInput: event.eventCreateInput,
        channelConnections: event.channelConnections,
      },
    };
  };

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    cy.request({
      url: "http://localhost:4000/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: getOperation(event),
    });
  }
};

export default createEvents;
