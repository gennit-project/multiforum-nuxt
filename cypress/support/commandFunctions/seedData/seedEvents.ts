import { DateTime } from "luxon";
import type { EventCreateInput } from "../../../../__generated__/graphql";

export type EventCreateInputWithChannels = {
  eventCreateInput: EventCreateInput;
  channelConnections: string[];
};

type BaseEvent = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  locationName?: string;
  address?: string;
  poster: string;
  cost: string;
  startTimeDayOfWeek: string;
  startTimeHourOfDay: number;
  canceled: boolean;
  tags?: string[];
  channels: string[];
  virtualEventUrl?: string;
};

// Helper function to generate future dates
const generateEventDates = (daysFromNow: number) => {
  const startDate = DateTime.now().plus({ days: daysFromNow }).set({ minute: 0, second: 0, millisecond: 0 });
  const endDate = startDate.plus({ hours: 2 });

  return {
    startTime: startDate.toISO(),
    endTime: endDate.toISO(),
    startTimeDayOfWeek: startDate.weekdayLong,
    startTimeHourOfDay: startDate.hour,
  };
};

const baseEvents: BaseEvent[] = [
  {
    title: "Test free/virtual event",
    description: undefined,
    ...generateEventDates(3),
    virtualEventUrl: "https://example.com",
    poster: "cluse",
    cost: "0",
    canceled: false,
    tags: [],
    channels: ["cats"],
  },
  {
    title: "Test online event in phx_music",
    description: undefined,
    ...generateEventDates(5),
    virtualEventUrl: "https://example.com",
    poster: "cluse",
    cost: "0",
    canceled: false,
    tags: ["newYears"],
    channels: ["phx_music"],
  },
  {
    title: "Test event with a trivia tag",
    description: undefined,
    ...generateEventDates(7),
    virtualEventUrl: "https://example.com",
    poster: "cluse",
    cost: "0",
    canceled: false,
    tags: ["trivia"],
    channels: ["phx_music"],
  },
  {
    title: "GATHERING OF BONES",
    description: "with Arsenic Kitchen, Commiserate, Killing Sunday",
    ...generateEventDates(10),
    location: { latitude: 33.39262, longitude: -111.940498 },
    locationName: "Yucca Tap Room",
    address: "29 W Southern Ave, Tempe, AZ 85282",
    poster: "alice",
    cost: "Free",
    canceled: false,
    channels: ["phx_music"],
  },
  {
    title: "NEW YEARS EVE with PAO!",
    description: "DJ Lady Staliet",
    ...generateEventDates(12),
    location: { latitude: 33.44999, longitude: -112.07408 },
    locationName: "Valley Bar",
    address: "130 N. Central Avenue, Phoenix, AZ, 85004",
    poster: "alice",
    cost: "$15, $5 service fee",
    canceled: false,
    channels: ["phx_concerts"],
  },
  {
    title: "MOST NECESSARY HIP HOP",
    description: "2015-PRESENT HIP HOP/TRAP",
    ...generateEventDates(15),
    location: { latitude: 33.44999, longitude: -112.07408 },
    locationName: "Valley Bar",
    address: "130 N. Central Avenue, Phoenix, AZ, 85004",
    poster: "alice",
    cost: "Free",
    canceled: false,
    channels: ["phx_concerts"],
  },
  {
    title: "Seinfeld Trivia: Festivus Edition",
    description: "Hosted by Emily the Lewis",
    ...generateEventDates(18),
    location: { latitude: 33.44999, longitude: -112.07408 },
    locationName: "Valley Bar",
    address: "130 N. Central Avenue, Phoenix, AZ, 85004",
    poster: "alice",
    cost: "$10, $5 service fee",
    canceled: false,
    tags: ["trivia"],
    channels: ["phx_concerts"],
  },
  {
    title: "Club Placebo Benefit Show",
    ...generateEventDates(21),
    location: { latitude: 33.448711, longitude: -112.083603 },
    locationName: "Crescent Ballroom",
    address: "308 N 2nd Ave, Phoenix, AZ 85003",
    poster: "alice",
    cost: "$10, $5 service fee",
    canceled: false,
    tags: ["music", "charityEvent"],
    channels: ["phx_concerts"],
  },
  {
    title: "New Year's Eve Block Party at Hance Park2",
    ...generateEventDates(25),
    location: { latitude: 33.46226, longitude: -112.07448 },
    locationName: "Margaret T. Hance Park",
    address: "67 W Culver St., Phoenix, AZ, 85003",
    poster: "alice",
    cost: "$15",
    canceled: false,
    tags: ["newYears"],
    channels: ["phx_concerts"],
  },
  {
    title: "Selena Night",
    ...generateEventDates(28),
    location: { latitude: 33.448711, longitude: -112.083603 },
    locationName: "Crescent Ballroom",
    address: "308 N 2nd Ave, Phoenix, AZ 85003",
    poster: "alice",
    cost: "$15",
    canceled: false,
    tags: ["Selena"],
    channels: ["phx_concerts"],
  },
  {
    title: "The Unlikely Candidates",
    description: "The Criticals, The Deadbeat Cousins",
    ...generateEventDates(32),
    location: { latitude: 33.448711, longitude: -112.083603 },
    locationName: "Crescent Ballroom",
    address: "308 N 2nd Ave, Phoenix, AZ 85003",
    poster: "alice",
    cost: "$18, $5 service fee",
    canceled: false,
    channels: ["phx_concerts"],
  },
  {
    title: "Desert Tails Benefit Show",
    description: "feat. Ischemia, Atoll, Show-N-Tell, Nooses",
    ...generateEventDates(35),
    location: { latitude: 33.39262, longitude: -111.940498 },
    locationName: "Yucca Tap Room",
    address: "29 W Southern Ave, Tempe, AZ 85282",
    poster: "alice",
    cost: "DONATIONS ENCOURAGED!",
    canceled: false,
    channels: ["phx_music"],
  },
  {
    title: "OPEN MIC NIGHT",
    description: "hosted by Haley Green, 8PM sign-up, 9PM music",
    ...generateEventDates(40),
    location: { latitude: 33.39262, longitude: -111.940498 },
    locationName: "Yucca Tap Room",
    address: "29 W Southern Ave, Tempe, AZ 85282",
    poster: "alice",
    cost: "0",
    canceled: false,
    channels: ["phx_music", "phx_concerts"],
  },
  {
    title: "STRFKR, The Undercover Dream Lovers, Das Kope",
    ...generateEventDates(45),
    location: { latitude: 33.45113, longitude: -112.079193 },
    locationName: "The Van Buren",
    address: "401 W Van Buren St, Phoenix, AZ 85003",
    poster: "alice",
    cost: "Ticket price unknown",
    canceled: false,
    channels: ["phx_concerts"],
  },
  {
    title: "We Were Promised Jetpacks",
    ...generateEventDates(50),
    location: { latitude: 33.49454, longitude: -112.0321 },
    locationName: "The Rebel Lounge",
    address: "2303 E Indian School Rd, Phoenix, AZ 85016",
    poster: "alice",
    cost: "$20",
    canceled: false,
    channels: ["phx_concerts"],
  },
];

export const events: EventCreateInputWithChannels[] = baseEvents.map(
  ({
    title,
    description,
    startTime,
    endTime,
    location,
    locationName,
    address,
    poster,
    cost,
    startTimeDayOfWeek,
    startTimeHourOfDay,
    canceled,
    tags,
    channels,
    virtualEventUrl
  }) => ({
    eventCreateInput: {
      title,
      ...(description && { description }),
      startTime,
      endTime,
      location,
      locationName,
      address,
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
      startTimeDayOfWeek,
      startTimeHourOfDay,
      canceled,
      ...(tags?.length > 0 && {
        Tags: {
          connect: tags.map((tag) => ({
              where: { node: { text: tag } },
            })),
          },
        }),
      virtualEventUrl
    },
    channelConnections: channels,
  })
);

export default events;