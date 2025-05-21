import { describe, it, expect } from "vitest";
import {
  getFilterValuesFromParams,
  defaultPlace,
} from "@/components/event/list/filters/getEventFilterValuesFromParams";
import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from "@/components/event/list/filters/filterStrings";
import LocationFilterTypes from "@/components/event/list/filters/locationFilterTypes";
import {
  timeShortcutValues,
  resultOrderTypes,
} from "@/components/event/list/filters/eventSearchOptions";

describe("getEventFilterValuesFromParams", () => {
  it("returns default values when route has no query parameters", () => {
    const input = {
      route: { query: {} },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result).toEqual({
      timeShortcut: timeShortcutValues.NONE,
      tags: [],
      channels: [],
      searchInput: "",
      showCanceledEvents: false,
      free: false,
      resultsOrder: chronologicalOrder,
      locationFilter: LocationFilterTypes.NONE,
      hasVirtualEventUrl: false,
      showArchived: false,
    });
  });

  it("sets hasVirtualEventUrl to true for events-list-search route", () => {
    const input = {
      route: {
        query: {},
        name: "events-list-search",
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.hasVirtualEventUrl).toBe(true);
  });

  it("sets locationFilter to ONLY_VIRTUAL when showOnlineOnly is true", () => {
    const input = {
      route: { query: {} },
      channelId: "",
      showOnlineOnly: true,
    };

    const result = getFilterValuesFromParams(input);

    expect(result.locationFilter).toBe(LocationFilterTypes.ONLY_VIRTUAL);
  });

  it("sets locationFilter to ONLY_WITH_ADDRESS when showInPersonOnly is true", () => {
    const input = {
      route: { query: {} },
      channelId: "",
      showInPersonOnly: true,
    };

    const result = getFilterValuesFromParams(input);

    expect(result.locationFilter).toBe(LocationFilterTypes.ONLY_WITH_ADDRESS);
  });

  it("parses timeShortcut correctly", () => {
    const input = {
      route: { query: { timeShortcut: timeShortcutValues.THIS_WEEKEND } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.timeShortcut).toBe(timeShortcutValues.THIS_WEEKEND);
  });

  it("parses radius and sets locationFilter to WITHIN_RADIUS", () => {
    const input = {
      route: { query: { radius: "25" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.radius).toBe(25);
    expect(result.locationFilter).toBe(LocationFilterTypes.WITHIN_RADIUS);
  });

  it("parses placeName but requires locationFilter=WITHIN_RADIUS to include it in result", () => {
    const input = {
      route: {
        query: {
          placeName: "New York City",
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.placeName).toBe("New York City");
  });

  it("parses placeAddress but requires locationFilter=WITHIN_RADIUS to include it in result", () => {
    const input = {
      route: {
        query: {
          placeAddress: "123 Main St, New York, NY 10001",
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.placeAddress).toBe("123 Main St, New York, NY 10001");
  });

  it("parses latitude but requires locationFilter=WITHIN_RADIUS to include it in result", () => {
    const input = {
      route: {
        query: {
          latitude: "40.7128",
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.latitude).toBe(40.7128);
  });

  it("ignores invalid latitude values", () => {
    const input = {
      route: { query: { latitude: "invalid" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.latitude).toBe(undefined);
  });

  it("parses longitude but requires locationFilter=WITHIN_RADIUS to include it in result", () => {
    const input = {
      route: {
        query: {
          longitude: "-74.0060",
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.longitude).toBe(-74.006);
  });

  it("ignores invalid longitude values", () => {
    const input = {
      route: { query: { longitude: "invalid" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.longitude).toBe(undefined);
  });

  it("parses tags correctly as comma-separated string", () => {
    const input = {
      route: { query: { tags: "music,concert,live" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.tags).toEqual(["music", "concert", "live"]);
  });

  it("parses tags correctly as array", () => {
    const input = {
      route: { query: { tags: ["music", "concert", "live"] } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.tags).toEqual(["music", "concert", "live"]);
  });

  it("defaults to empty array for invalid tags type", () => {
    const input = {
      route: { query: { tags: 123 } }, // Invalid type
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.tags).toEqual([]);
  });

  it("parses channels as string correctly", () => {
    const input = {
      route: { query: { channels: "music-events" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.channels).toEqual(["music-events"]);
  });

  it("parses channels as array correctly", () => {
    const input = {
      route: { query: { channels: ["music-events", "outdoor-events"] } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.channels).toEqual(["music-events", "outdoor-events"]);
  });

  it("parses searchInput correctly", () => {
    const input = {
      route: { query: { searchInput: "jazz concert" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.searchInput).toBe("jazz concert");
  });

  it("parses showCanceledEvents as true correctly", () => {
    const input = {
      route: { query: { showCanceledEvents: "true" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.showCanceledEvents).toBe(true);
  });

  it("parses showCanceledEvents as false correctly", () => {
    const input = {
      route: { query: { showCanceledEvents: "false" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.showCanceledEvents).toBe(false);
  });

  it("parses showOnlyFreeEvents as free=true correctly", () => {
    const input = {
      route: { query: { showOnlyFreeEvents: "true" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.free).toBe(true);
  });

  it("parses showOnlyFreeEvents as free=false correctly", () => {
    const input = {
      route: { query: { showOnlyFreeEvents: "false" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.free).toBe(false);
  });

  it("parses resultsOrder as chronological correctly", () => {
    const input = {
      route: { query: { resultsOrder: resultOrderTypes.CHRONOLOGICAL } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.resultsOrder).toEqual(chronologicalOrder);
  });

  it("parses resultsOrder as reverse chronological correctly", () => {
    const input = {
      route: { query: { resultsOrder: resultOrderTypes.REVERSE_CHRONOLOGICAL } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.resultsOrder).toEqual(reverseChronologicalOrder);
  });

  it("parses locationFilter correctly", () => {
    const input = {
      route: { query: { locationFilter: LocationFilterTypes.ONLY_VIRTUAL } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.locationFilter).toBe(LocationFilterTypes.ONLY_VIRTUAL);
  });

  it("parses showArchived as true correctly", () => {
    const input = {
      route: { query: { showArchived: "true" } },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.showArchived).toBe(true);
  });

  it("uses default radius of 0 when channelId is provided", () => {
    const input = {
      route: {
        query: {
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        },
      },
      channelId: "test-channel",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.radius).toBe(0);
  });

  it("uses provided radius when specified in query", () => {
    const input = {
      route: {
        query: {
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
          radius: "25",
        },
      },
      channelId: "test-channel",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.radius).toBe(25);
  });

  it("returns WITHIN_RADIUS location filter with default place values when locationFilter is WITHIN_RADIUS", () => {
    const input = {
      route: {
        query: {
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.locationFilter).toBe(LocationFilterTypes.WITHIN_RADIUS);
    expect(result.placeName).toBe(defaultPlace.name);
    expect(result.placeAddress).toBe(defaultPlace.address);
    expect(result.latitude).toBe(defaultPlace.latitude);
    expect(result.longitude).toBe(defaultPlace.longitude);
  });

  it("returns ONLY_VIRTUAL location filter when specified", () => {
    const input = {
      route: {
        query: {
          locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.locationFilter).toBe(LocationFilterTypes.ONLY_VIRTUAL);
    expect(result.placeName).toBeUndefined();
    expect(result.placeAddress).toBeUndefined();
    expect(result.latitude).toBeUndefined();
    expect(result.longitude).toBeUndefined();
  });

  it("returns ONLY_WITH_ADDRESS location filter when specified", () => {
    const input = {
      route: {
        query: {
          locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.locationFilter).toBe(LocationFilterTypes.ONLY_WITH_ADDRESS);
    expect(result.placeName).toBeUndefined();
    expect(result.placeAddress).toBeUndefined();
    expect(result.latitude).toBeUndefined();
    expect(result.longitude).toBeUndefined();
  });

  it("handles multiple query parameters correctly", () => {
    const input = {
      route: {
        query: {
          timeShortcut: timeShortcutValues.THIS_WEEKEND,
          tags: ["music", "festival"],
          searchInput: "jazz",
          showCanceledEvents: "false",
          showOnlyFreeEvents: "true",
          locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
          showArchived: "true",
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result).toEqual({
      timeShortcut: timeShortcutValues.THIS_WEEKEND,
      tags: ["music", "festival"],
      channels: [],
      searchInput: "jazz",
      showCanceledEvents: false,
      free: true,
      resultsOrder: chronologicalOrder,
      locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
      hasVirtualEventUrl: false,
      showArchived: true,
    });
  });

  it("ignores invalid query parameters", () => {
    const input = {
      route: {
        query: {
          invalidParam: "value",
          tags: "music",
        },
      },
      channelId: "",
    };

    const result = getFilterValuesFromParams(input);

    expect(result.tags).toEqual(["music"]);
    expect(result.invalidParam).toBeUndefined();
  });
});
