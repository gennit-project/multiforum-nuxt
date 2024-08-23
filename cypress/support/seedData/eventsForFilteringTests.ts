import { EventCreateInput } from "../../../src/__generated__/graphql";

export type EventCreateInputWithChannels = {
  eventCreateInput: EventCreateInput;
  channelConnections: string[];
};

const events: EventCreateInputWithChannels[] = [
  {
    eventCreateInput: {
      title: "Test free/virtual event",
      startTime: "2024-04-21T02:21:37.146Z",
      endTime: "2024-04-21T02:21:37.146Z",
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
      startTimeDayOfWeek: "Wednesday",
      startTimeHourOfDay: 20,
    },
    channelConnections: ["cats"],
  },
  {
    eventCreateInput: {
      title: "Test online event in phx_music",
      description: undefined, 
      startTime: "2024-04-21T02:21:37.146Z",
      endTime: "2024-04-21T02:21:37.146Z",
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
      startTimeDayOfWeek: "Wednesday",
      startTimeHourOfDay: 20,
      Tags: {
        "connectOrCreate": [
          {
            "onCreate": {
              "node": {
                "text": "newYears"
              }
            },
            "where": {
              "node": {
                "text": "newYears"
              }
            }
          }
        ]
      },
    },
    channelConnections: ["phx_music"],
  },
  {
    eventCreateInput: {
      title: "Test event with a trivia tag",
      description: undefined, 
      startTime: "2024-04-21T02:21:37.146Z",
      endTime: "2024-04-21T02:21:37.146Z",
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
      startTimeDayOfWeek: "Wednesday",
      startTimeHourOfDay: 20,
      Tags: {
        "connectOrCreate": [
          {
            "onCreate": {
              "node": {
                "text": "trivia"
              }
            },
            "where": {
              "node": {
                "text": "trivia"
              }
            }
          }
        ]
      },
    },
    channelConnections: ["phx_music"],
  },
];

export default events;
