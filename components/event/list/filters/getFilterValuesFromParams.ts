import { SearchEventValues } from "@/types/Event";
import { chronologicalOrder, reverseChronologicalOrder } from "./filterStrings";
import LocationFilterTypes from "./locationFilterTypes";
import {
  createDefaultSelectedWeeklyHourRanges,
  createDefaultSelectedHourRanges,
  createDefaultSelectedWeekdays,
  hourRangesObject,
} from "./eventSearchOptions";
import { timeShortcutValues } from "./eventSearchOptions";
import { resultOrderTypes } from "./eventSearchOptions";

const defaultPlace = {
  // Default map center is Tempe Public Library
  name: "Tempe Public Library",
  latitude: 33.39131450000001,
  longitude: -111.9280626,
  referencePointId: "ChIJR35tTZ8IK4cR2D0p0AxOqbg",
  address: "3500 S Rural Rd, Tempe, AZ 85282, USA",
};

type GetFilterValuesInput = {
  route: any;
  channelId: string;
  showOnlineOnly?: boolean;
  showInPersonOnly?: boolean;
};

const getFilterValuesFromParams = function (
  input: GetFilterValuesInput,
): SearchEventValues {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  const { route, channelId } = input;
  const cleanedValues: SearchEventValues = {};

  // For the online events list, only include
  // events with a virtual event URL.
  if (route?.name === "SitewideSearchEventPreview") {
    cleanedValues.hasVirtualEventUrl = true;
  }

  if (input.showOnlineOnly) {
    cleanedValues.locationFilter = LocationFilterTypes.ONLY_VIRTUAL;
  }

  if (input.showInPersonOnly) {
    cleanedValues.locationFilter = LocationFilterTypes.ONLY_WITH_ADDRESS;
  }

  for (const key in route?.query || {}) {
    const val = route.query[key];

    switch (key) {
      case "timeShortcut":
        if (typeof val === "string") {
          cleanedValues.timeShortcut = val;
        }
        break;
      case "radius":
        cleanedValues.radius = parseFloat(val);
        cleanedValues.locationFilter = LocationFilterTypes.WITHIN_RADIUS;
        break;
      case "placeName":
        if (typeof val === "string") {
          cleanedValues.placeName = val;
        }
        break;
      case "placeAddress":
        if (typeof val === "string") {
          cleanedValues.placeAddress = val;
        }
        break;
      case "latitude":
        if (typeof val === "string") {
          // Cast string to number for filtering by distance
          const parsedVal = parseFloat(val);
          if (!isNaN(parsedVal)) {
            cleanedValues.latitude = parsedVal;
          }
        }
        break;
      case "longitude":
        if (typeof val === "string") {
          // Cast string to number for filtering by distance
          const parsedVal = parseFloat(val);
          if (!isNaN(parsedVal)) {
            cleanedValues.longitude = parsedVal;
          }
        }
        break;
      case "tags":
        if (typeof val === "string") {
          cleanedValues.tags = [val];
        }
        if (typeof val === "object") {
          // If it is an array of strings, which
          // is good, then the type is an object.
          cleanedValues.tags = val;
        }
        break;
      case "channels":
        if (typeof val === "string") {
          cleanedValues.channels = [val];
        }
        if (typeof val === "object") {
          // If it is an array of strings, which
          // is good, then the type is an object.
          cleanedValues.channels = val;
        }
        break;
      case "searchInput":
        if (typeof val === "string") {
          cleanedValues.searchInput = val;
        }
        break;
      case "showCanceledEvents":
        // May need to cast to boolean
        if (val === "true") {
          cleanedValues.showCanceledEvents = true;
        } else if (val === "false") {
          cleanedValues.showCanceledEvents = false;
        }
        break;
      case "showOnlyFreeEvents":
        if (val === "true") {
          cleanedValues.free = true;
        } else if (val === "false") {
          cleanedValues.free = false;
        }
        break;
      case "resultsOrder":
        if (val === resultOrderTypes.CHRONOLOGICAL) {
          cleanedValues.resultsOrder = chronologicalOrder;
        }
        if (val === resultOrderTypes.REVERSE_CHRONOLOGICAL) {
          cleanedValues.resultsOrder = reverseChronologicalOrder;
        }
        break;
      case "locationFilter":
        cleanedValues.locationFilter = val?.toString();
        break;
      case "weekdays":
        // Example value: weekdays=[{"startTimeDayOfWeek":"1"}]
        try {
          const weekdaysInQuery = JSON.parse(val);
          cleanedValues.weekdays = createDefaultSelectedWeekdays();

          for (let i = 0; i < weekdaysInQuery.length; i++) {
            const obj = weekdaysInQuery[i];

            if (obj && obj.startTimeDayOfWeek) {
              cleanedValues.weekdays[obj.startTimeDayOfWeek] = true;
            }
          }
        } catch (e: any) {
          throw new Error(e);
        }
        break;
      case "hourRanges":
        // Example value: hourRanges=[{"startTimeHourOfDay":"3am-6am"}]
        try {
          const hourRanges = JSON.parse(val);

          cleanedValues.hourRanges = createDefaultSelectedHourRanges();

          for (let i = 0; i < hourRanges.length; i++) {
            const obj = hourRanges[i];

            if (
              obj &&
              obj.startTimeHourOfDay !== undefined &&
              hourRangesObject[obj.startTimeHourOfDay]
            ) {
              // Due to the way that Neo4j works, it is faster
              // to check for specific hours that an event may
              // begin than it is to check for hour ranges
              // using greater-than or less-than operators.

              cleanedValues.hourRanges[obj.startTimeHourOfDay] = true;
            }
          }
        } catch (e: any) {
          throw new Error(e);
        }
        break;
      case "weeklyHourRanges":
        // Example value: weeklyHourRanges=[{"AND":[{"startTimeHourOfDay":"3am-6am"},{"startTimeDayOfWeek":"4"}]}]
        try {
          const weeklyHourRangesInQuery = JSON.parse(val);

          cleanedValues.weeklyHourRanges =
            createDefaultSelectedWeeklyHourRanges();

          for (let i = 0; i < weeklyHourRangesInQuery.length; i++) {
            const obj = weeklyHourRangesInQuery[i];
            const objConditions = obj.AND;
            const hourOfDay = objConditions[0]?.startTimeHourOfDay;
            const dayOfWeek = objConditions[1]?.startTimeDayOfWeek;

            cleanedValues.weeklyHourRanges[dayOfWeek][hourOfDay] = true;
          }
        } catch (e: any) {
          throw new Error(e);
        }
        break;
    }
  }

  const {
    timeShortcut,
    radius,
    placeName,
    placeAddress,
    latitude,
    longitude,
    tags,
    channels,
    searchInput,
    showCanceledEvents,
    free,
    weekdays,
    hourRanges,
    weeklyHourRanges,
    resultsOrder,
    locationFilter,
    hasVirtualEventUrl,
  } = cleanedValues;




  const defaultRadius = 160.934; // 100 miles
  let selectedRadius = defaultRadius;

  if (channelId) {
    selectedRadius = 0;
  }

  if (radius !== undefined) {
    selectedRadius = radius;
  }

  const filterValues: SearchEventValues = {
    timeShortcut: timeShortcut || timeShortcutValues.NONE,
    tags: tags || [],
    channels: channels || [],
    searchInput: searchInput || "",
    showCanceledEvents: showCanceledEvents || false,
    free: free || false,
    weekdays: weekdays || createDefaultSelectedWeekdays(),
    hourRanges: hourRanges || createDefaultSelectedHourRanges(),
    weeklyHourRanges:
      weeklyHourRanges || createDefaultSelectedWeeklyHourRanges(),
    resultsOrder: resultsOrder || chronologicalOrder,
    hasVirtualEventUrl: hasVirtualEventUrl || false,
  };

  const locationParams = {
    locationFilter: LocationFilterTypes.WITHIN_RADIUS,
    radius: selectedRadius,
    placeName: placeName || defaultPlace.name,
    placeAddress: placeAddress || defaultPlace.address,
    latitude: latitude || defaultPlace.latitude,
    longitude: longitude || defaultPlace.longitude,
  };

  switch (locationFilter) {
    case LocationFilterTypes.WITHIN_RADIUS:
      return {
        ...filterValues,
        ...locationParams,
      };
    case LocationFilterTypes.ONLY_VIRTUAL:
      return {
        ...filterValues,
        locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
      };
    case LocationFilterTypes.ONLY_WITH_ADDRESS:
      return {
        ...filterValues,
        locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS,
      };
    default:
      return {
        ...filterValues,
        locationFilter: LocationFilterTypes.NONE,
      };
  }
};

export { getFilterValuesFromParams, defaultPlace };
