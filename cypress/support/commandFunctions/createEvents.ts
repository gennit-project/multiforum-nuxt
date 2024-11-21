import type { EventCreateInputWithChannels } from "../seedData/events";

const createEvents = (events: EventCreateInputWithChannels[]) => {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    cy.authenticatedGraphQL(
      `
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
      {
        eventCreateInput: event.eventCreateInput,
        channelConnections: event.channelConnections,
      }
    );
  }
};

export default createEvents;
