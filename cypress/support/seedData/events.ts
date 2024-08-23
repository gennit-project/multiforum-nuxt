import { EventCreateInput } from "../../../src/__generated__/graphql";

export type EventCreateInputWithChannels = {
  eventCreateInput: EventCreateInput;
  channelConnections: string[];
};

const events: EventCreateInputWithChannels[] = [
  {
    eventCreateInput: {
      title: "GATHERING OF BONES",
      description: "with Arsenic Kitchen, Commiserate, Killing Sunday",
      startTime: "2024-01-20T05:21:37.146Z",
      endTime: "2024-01-20T05:21:37.146Z",
      location: {
        latitude: 33.39262,
        longitude: -111.940498,
      },
      locationName: "Yucca Tap Room",
      address: "29 W Southern Ave, Tempe, AZ 85282",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "Free",
      startTimeDayOfWeek: "Thursday",
      startTimeHourOfDay: 20,
      canceled: false,
    },
    channelConnections: ["phx_music"],
  },
  {
    eventCreateInput: {
      title: "NEW YEARS EVE with PAO!",
      description: "DJ Lady Staliet",
      startTime: "2024-12-31T05:21:37.146Z",
      endTime: "2024-12-31T05:21:37.146Z",
      location: {
        latitude: 33.44999,
        longitude: -112.07408,
      },
      locationName: "Valley Bar",
      address: "130 N. Central Avenue, Phoenix, AZ, 85004",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$15, $5 service fee",
      startTimeDayOfWeek: "Friday",
      startTimeHourOfDay: 20,
      canceled: false,
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "MOST NECESSARY HIP HOP",
      description: "2015-PRESENT HIP HOP/TRAP",
      startTime: "2024-12-25T05:21:37.146Z",
      endTime: "2024-12-25T05:21:37.146Z",
      location: {
        latitude: 33.44999,
        longitude: -112.07408,
      },
      locationName: "Valley Bar",
      address: "130 N. Central Avenue, Phoenix, AZ, 85004",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "Free",
      startTimeDayOfWeek: "Saturday",
      startTimeHourOfDay: 22,
      canceled: false,
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "Seinfeld Trivia: Festivus Edition",
      description: "Hosted by Emily the Lewis",
      startTime: "2024-12-23T05:21:37.146Z",
      endTime: "2024-12-23T05:21:37.146Z",
      location: {
        latitude: 33.44999,
        longitude: -112.07408,
      },
      locationName: "Valley Bar",
      address: "130 N. Central Avenue, Phoenix, AZ, 85004",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$10, $5 service fee",
      startTimeDayOfWeek: "Thursday",
      startTimeHourOfDay: 19,
      canceled: false,
      Tags: {
        connect: [
          {
            where: {
              node: { text: "trivia " },
            },
          },
        ],
      },
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "Club Placebo Benefit Show",
      startTime: "2024-01-08T05:21:37.146Z",
      endTime: "2024-01-08T05:21:37.146Z",
      location: {
        latitude: 33.448711,
        longitude: -112.083603,
      },
      locationName: "Crescent Ballroom",
      address: "308 N 2nd Ave, Phoenix, AZ 85003",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$10, $5 service fee",
      startTimeDayOfWeek: "Saturday",
      startTimeHourOfDay: 16,
      canceled: false,
      Tags: {
        connect: [
          {
            where: {
              node: { text: "music " },
            },
          },
          {
            where: {
              node: {
                text: "charityEvent",
              },
            },
          },
        ],
      },
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "New Year's Eve Block Party at Hance Park2",
      startTime: "2024-12-31T02:21:37.146Z",
      endTime: "2024-12-31T02:21:37.146Z",
      location: {
        latitude: 33.46226,
        longitude: -112.07448,
      },
      locationName: "Margaret T. Hance Park",
      address: "67 W Culver St., Phoenix, AZ, 85003",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$15",
      startTimeDayOfWeek: "Friday",
      startTimeHourOfDay: 20,
      canceled: false,
      Tags: {
        connect: [
          {
            where: {
              node: { text: "newYears " },
            },
          },
        ],
      },
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "Selena Night",
      startTime: "2024-01-01T02:21:37.146Z",
      endTime: "2024-01-01T02:21:37.146Z",
      location: {
        latitude: 33.448711,
        longitude: -112.083603,
      },
      locationName: "Crescent Ballroom",
      address: "308 N 2nd Ave, Phoenix, AZ 85003",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$15",
      startTimeDayOfWeek: "Saturday",
      startTimeHourOfDay: 20,
      canceled: false,
      Tags: {
        connect: [
          {
            where: {
              node: { text: "Selena " },
            },
          },
        ],
      },
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "The Unlikely Candidates",
      description: "The Criticals, The Deadbeat Cousins",
      startTime: "2024-01-04T05:21:37.146Z",
      endTime: "2024-01-04T05:21:37.146Z",
      location: {
        latitude: 33.448711,
        longitude: -112.083603,
      },
      locationName: "Crescent Ballroom",
      address: "308 N 2nd Ave, Phoenix, AZ 85003",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$18, $5 service fee",
      startTimeDayOfWeek: "Tuesday",
      startTimeHourOfDay: 19,
      canceled: false,
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "Desert Tails Benefit Show",
      description: "feat. Ischemia, Atoll, Show-N-Tell, Nooses",
      startTime: "2024-01-29T05:21:37.146Z",
      endTime: "2024-01-20T05:21:37.146Z",
      location: {
        latitude: 33.39262,
        longitude: -111.940498,
      },
      locationName: "Yucca Tap Room",
      address: "29 W Southern Ave, Tempe, AZ 85282",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "DONATIONS ENCOURAGED!",
      startTimeDayOfWeek: "Saturday",
      startTimeHourOfDay: 20,
      canceled: false,
    },
    channelConnections: ["phx_music"],
  },
  {
    eventCreateInput: {
      title: "OPEN MIC NIGHT",
      description: "hosted by Haley Green, 8PM sign-up, 9PM music",
      startTime: "2024-01-31T05:21:37.146Z",
      endTime: "2024-01-31T05:21:37.146Z",
      location: {
        latitude: 33.39262,
        longitude: -111.940498,
      },
      locationName: "Yucca Tap Room",
      address: "29 W Southern Ave, Tempe, AZ 85282",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "0",
      startTimeDayOfWeek: "Monday",
      startTimeHourOfDay: 21,
      canceled: false,
    },
    channelConnections: ["phx_music", "phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "STRFKR, The Undercover Dream Lovers, Das Kope",
      startTime: "2024-02-25T02:20:00.146Z",
      endTime: "2024-02-25T02:20:00.146Z",
      location: {
        latitude: 33.45113,
        longitude: -112.079193,
      },
      locationName: "The Van Buren",
      address: "401 W Van Buren St, Phoenix, AZ 85003",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "Ticket price unknown",
      startTimeDayOfWeek: "Friday",
      startTimeHourOfDay: 20,
      canceled: false,
    },
    channelConnections: ["phx_concerts"],
  },
  {
    eventCreateInput: {
      title: "We Were Promised Jetpacks",
      startTime: "2024-03-21T02:21:37.146Z",
      endTime: "2024-03-21T02:21:37.146Z",
      location: {
        latitude: 33.49454,
        longitude: -112.0321,
      },
      locationName: "The Rebel Lounge",
      address: "2303 E Indian School Rd, Phoenix, AZ 85016",
      Poster: {
        connect: {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      },
      cost: "$20",
      startTimeDayOfWeek: "Monday",
      startTimeHourOfDay: 20,
      canceled: false,
    },
    channelConnections: ["phx_concerts"],
  },
];

export default events;
