import LocationFilterTypes from "./locationFilterTypes";
import type { SearchEventValues } from "@/types/Event";
import { timeShortcutValues } from "./eventSearchOptions";
import { DateTime } from "luxon";
import type { EventWhere } from "@/__generated__/graphql";

const now = DateTime.now();

const getStartOfThisWeekend = () => {
  const startOfWeek = now.startOf("week");
  return startOfWeek.plus({ days: 5 });
};

type GetEventWhereInput = {
  filterValues: SearchEventValues;
  showMap: boolean;
  channelId: string;
  onlineOnly: boolean;
};

// The purpose of this function is to convert event filter variables
// into the EventWhere input object, exactly as the EventWhere is defined in the auto-generated GraphQL
// documentation for querying events.
const getEventWhere = (input: GetEventWhereInput): EventWhere => {
  const { filterValues, showMap, channelId, onlineOnly } = input;
  const {
    timeShortcut,
    radius,
    tags,
    channels,
    locationFilter,
    searchInput,
    showCanceledEvents,
    latitude,
    longitude,
    free,
    hasVirtualEventUrl,
    showArchived
  } = filterValues;
  // These conditions will be added to the filter
  // object under an AND operator.
  let conditions: EventWhere[] = [];

  if (!channelId) {
    // In sitewide view, require at least one channel.
    if (!showArchived) {
      conditions.push({
        EventChannels_SOME: {
          NOT: {
            channelUniqueName: null,
          },
          archived: false
        },
      });
    } else {
      conditions.push({
        EventChannels_SOME: {
          NOT: {
            channelUniqueName: null,
          },
        },
      });
    }
    
  }

  // Free event filter
  if (free) {
    conditions.push({ free: true });
  } else {
    // if free is false, do not filter for { free: false },
    // because the default value is null instead of false.
    // It is better to remove it from the list of conditions.
    conditions = conditions.filter((condition) => {
      return !condition.free;
    })
  }

  if (!showCanceledEvents) {
    conditions.push({ canceled: false });
    // If showCanceledEvents is true, we want to
    // show all events, so we don't need to add a filter.
  }

  if (hasVirtualEventUrl) {
    conditions.push({ NOT: { virtualEventUrl: null } });
  }

  // Text search filter
  if (searchInput) {
    conditions.push({
      OR: [
        {
          title_MATCHES: `(?i).*${searchInput}.*`,
        },
        {
          description_MATCHES: `(?i).*${searchInput}.*`,
        },
      ],
    });
  }
  // Location filter
  switch (locationFilter) {
   
   
    case LocationFilterTypes.NONE:
      if (showMap) {
        conditions.push({ NOT: { location: null } });
      }
      break;
    case LocationFilterTypes.ONLY_WITH_ADDRESS:
      // Filter by events that have a location
      // with coordinates
      
      conditions.push({ NOT: { locationName: null } });
      break;

    case LocationFilterTypes.ONLY_VIRTUAL:
      // Filter by events that have a virtual event URL
      if (showMap) {
        // If map view is shown and events are filtered
        // to show only virtual events, only include
        // events with both a physical location
        // and a virtual event url
        conditions.push({ location: null });
      }
      break;

    case LocationFilterTypes.WITHIN_RADIUS:
      if (radius && latitude && longitude) {
        // Filter for events within a radius of a reference point
        conditions.push({
          location_LTE: {
            point: {
              latitude,
              longitude,
            },
            // Radius is in m
            distance: radius * 1000,
          },
        });
      }
      // if the radius is 0, that means any distance.
      // just add the location filter.
      else if (radius === 0) {
        conditions.push({ NOT: { locationName: null } });
      }
  }

  if (onlineOnly) {
    conditions.push({
      NOT: {
        virtualEventUrl: null,
      },
    });
  }

  // Tag filter
  if (tags && tags.length > 0) {
    const matchTags = tags.reduce((prev: any, curr: any) => {
      return prev.concat({ text_CONTAINS: curr });
    }, []);
    conditions.push({
      Tags_SOME: {
        OR: matchTags,
      },
    });
  }
  const truthyChannels = channels?.filter((channel: string) => {
    // Don't filter for a channel if a channel is an empty string.
    // This could happen if the query params are `?channels=`.
    return !!channel;
  }) || [];

  // Channel filter
  if (channelId) {
    // If we are in the channel view, only show events from
    // that channel, even if a channel filter has accidentally
    // gotten into the query params.
    if (!showArchived) {
      conditions.push({
        EventChannels_SOME: {
          channelUniqueName: channelId,
          archived: false
        },
      });
    } else {
      conditions.push({
        EventChannels_SOME: {
          channelUniqueName: channelId,
        },
      });
    }
  
  } else if (truthyChannels.length > 0) {
    // If we are in the sitewide event search page,
    // show events from any channel in the query params.

    const matchChannels = truthyChannels.reduce(
      // Technically a selected channel could be an array
      // of strings, but we expect it to always be a string.
      (prev: any, curr: any) => {
        if (!showArchived)  {
          return prev.concat({ 
            channelUniqueName_CONTAINS: curr, 
            archived: false 
          });
        }
        return prev.concat({ channelUniqueName_CONTAINS: curr });
      },
      [],
    );
    conditions.push({
      EventChannels_SOME: {
        OR: matchChannels,
      },
    });
  }

  const getStartOfNextWeek = () => {
    const today = now.startOf('day');
    const nextSunday = today.set({ weekday: 7 }); // 7 is Sunday
    
    // If today is already Sunday, get next Sunday
    // If today is Saturday, nextSunday will be tomorrow
    if (today >= nextSunday) {
      return nextSunday.plus({ weeks: 1 });
    }
    return nextSunday;
  };

  const defaultStartDateObj = now.startOf("hour");
  const defaultEndDateRangeObj = defaultStartDateObj.plus({ years: 2 });
  const defaultStartDateISO = defaultStartDateObj.toISO();
  const defaultEndDateRangeISO = defaultEndDateRangeObj.toISO();
  const startOfThisWeekend = getStartOfThisWeekend();
  const startOfNextWeek = getStartOfNextWeek();
  const startOfThisMonth = now.startOf("month");

  // Filter events by time range based on a selected
  // time filter shortcut, for example, today or next week.
  let beginningOfDateRangeISO = defaultStartDateISO;
  let endOfDateRangeISO = defaultEndDateRangeISO;

  switch (timeShortcut) {
    case timeShortcutValues.TODAY:
      beginningOfDateRangeISO = now.startOf("day").toISO();
      endOfDateRangeISO = now.endOf("day").toISO();
      break;
    case timeShortcutValues.NEXT_MONTH:
      beginningOfDateRangeISO = startOfThisMonth.plus({ months: 1 }).toISO();
      endOfDateRangeISO = startOfThisMonth.plus({ months: 2 }).toISO();
      break;
    case timeShortcutValues.NEXT_WEEK:
      beginningOfDateRangeISO = startOfNextWeek.toISO();
      endOfDateRangeISO = startOfNextWeek.plus({ weeks: 1 }).toISO();
      break;
    case timeShortcutValues.NEXT_WEEKEND:
      beginningOfDateRangeISO = startOfNextWeek.plus({ days: 5 }).toISO();
      endOfDateRangeISO = startOfNextWeek.plus({ weeks: 1 }).toISO();
      break;
    case timeShortcutValues.PAST_EVENTS:
      beginningOfDateRangeISO = now.minus({ years: 2 }).toISO();
      endOfDateRangeISO = now.startOf("day").toISO();
      break;
    case timeShortcutValues.THIS_MONTH:
      beginningOfDateRangeISO = startOfThisMonth.toISO();
      endOfDateRangeISO = startOfThisMonth.plus({ months: 1 }).toISO();
      break;
    case timeShortcutValues.THIS_WEEKEND:
      beginningOfDateRangeISO = startOfThisWeekend.toISO();
      endOfDateRangeISO = startOfThisWeekend.plus({ days: 2 }).toISO();
      break;
    case timeShortcutValues.TOMORROW:
      beginningOfDateRangeISO = now.startOf("day").plus({ days: 1 }).toISO();
      endOfDateRangeISO = now.endOf("day").plus({ days: 1 }).toISO();
      break;
    case timeShortcutValues.NONE:
      beginningOfDateRangeISO = defaultStartDateISO;
      endOfDateRangeISO = defaultEndDateRangeISO;
      break;
  }

  const result: EventWhere = {
    AND: (conditions = [
      // Ignore the typescript warnings. These filters are part
      // of the real EventWhere on the backend, but not the
      // auto-generated typescript types that exist only
      // for our convenience on the frontend.
      // @ts-ignore
      ...conditions,
      // @ts-ignore
      // {
      //   EventChannelsAggregate: {
      //     count_GT: 0,
      //   },
      // },
      // @ts-ignore
      {
        endTime_GT: `${beginningOfDateRangeISO}`,
      },
      // @ts-ignore
      {
        endTime_LT: `${endOfDateRangeISO}`,
      },
    ]),
  };
  return result
};
export default getEventWhere;
