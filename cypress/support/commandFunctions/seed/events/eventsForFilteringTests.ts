import type { EventCreateInput } from "../../../../../__generated__/graphql";

export type EventCreateInputWithChannels = {
  eventCreateInput: EventCreateInput;
  channelConnections: string[];
};

type BaseEvent = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  virtualEventUrl: string;
  poster: string;
  cost: string;
  canceled: boolean;
  startTimeDayOfWeek: string;
  startTimeHourOfDay: number;
  tags: string[];
  channels: string[];
};

const baseEvents: BaseEvent[] = [
  {
    title: "Test free/virtual event",
    description: undefined,
    startTime: "2024-04-21T02:21:37.146Z",
    endTime: "2024-04-21T02:21:37.146Z",
    virtualEventUrl: "https://example.com",
    poster: "cluse",
    cost: "0",
    canceled: false,
    startTimeDayOfWeek: "Wednesday",
    startTimeHourOfDay: 20,
    tags: [],
    channels: ["cats"],
  },
  {
    title: "Test online event in phx_music",
    description: undefined,
    startTime: "2024-04-21T02:21:37.146Z",
    endTime: "2024-04-21T02:21:37.146Z",
    virtualEventUrl: "https://example.com",
    poster: "cluse",
    cost: "0",
    canceled: false,
    startTimeDayOfWeek: "Wednesday",
    startTimeHourOfDay: 20,
    tags: ["newYears"],
    channels: ["phx_music"],
  },
  {
    title: "Test event with a trivia tag",
    description: undefined,
    startTime: "2024-04-21T02:21:37.146Z",
    endTime: "2024-04-21T02:21:37.146Z",
    virtualEventUrl: "https://example.com",
    poster: "cluse",
    cost: "0",
    canceled: false,
    startTimeDayOfWeek: "Wednesday",
    startTimeHourOfDay: 20,
    tags: ["trivia"],
    channels: ["phx_music"],
  },
];

export const events: EventCreateInputWithChannels[] = baseEvents.map(
  ({
    title,
    description,
    startTime,
    endTime,
    virtualEventUrl,
    poster,
    cost,
    canceled,
    startTimeDayOfWeek,
    startTimeHourOfDay,
    tags,
    channels,
  }) => ({
    eventCreateInput: {
      title,
      ...(description && { description }),
      startTime,
      endTime,
      virtualEventUrl,
      Poster: {
        connect: {
          where: {
            node: {
              username: poster,
            },
          },
        },
      },
      cost,
      canceled,
      startTimeDayOfWeek,
      startTimeHourOfDay,
      ...(tags.length > 0 && {
        Tags: {
          connect: tags.map((tag) => ({
            where: {
              node: {
                text: tag,
              },
            },
          })),
          create: tags.map((tag) => ({
            node: {
              text: tag,
            },
          })),
        },
      }),
    },
    channelConnections: channels,
  })
);

export default events;
