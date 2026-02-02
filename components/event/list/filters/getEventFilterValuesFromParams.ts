import type { SearchEventValues } from '@/types/Event';
import { chronologicalOrder, reverseChronologicalOrder } from './filterStrings';
import { LocationFilterTypes } from './locationFilterTypes';
import { timeShortcutValues, resultOrderTypes } from './eventSearchOptions';

// Minimal route type for the fields actually used by this function
// Uses Record<string, unknown> for query to allow flexible test mocking and vue-router compatibility
type RouteWithQuery = {
  name?: string | symbol | null;
  query?: Record<string, unknown>;
};

export type { RouteWithQuery };

const defaultPlace = {
  // Default map center is Tempe Public Library
  name: 'Tempe Public Library',
  latitude: 33.39131450000001,
  longitude: -111.9280626,
  referencePointId: 'ChIJR35tTZ8IK4cR2D0p0AxOqbg',
  address: '3500 S Rural Rd, Tempe, AZ 85282, USA',
};

type GetFilterValuesInput = {
  route: RouteWithQuery | null;
  channelId: string;
  showOnlineOnly?: boolean;
  showInPersonOnly?: boolean;
};

const getFilterValuesFromParams = function (
  input: GetFilterValuesInput
): SearchEventValues {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  const { route, channelId } = input;
  const cleanedValues: SearchEventValues = {
    timeShortcut: timeShortcutValues.NONE,
    tags: [],
    channels: [],
    searchInput: '',
    showCanceledEvents: false,
    free: false,
    resultsOrder: chronologicalOrder,
    locationFilter: LocationFilterTypes.NONE,
    hasVirtualEventUrl: false,
    showArchived: false,
  };

  // For the online events list, only include
  // events with a virtual event URL.
  if (route?.name === 'events-list-search') {
    cleanedValues.hasVirtualEventUrl = true;
  }

  if (input.showOnlineOnly) {
    cleanedValues.locationFilter = LocationFilterTypes.ONLY_VIRTUAL;
  }

  if (input.showInPersonOnly) {
    cleanedValues.locationFilter = LocationFilterTypes.ONLY_WITH_ADDRESS;
  }

  const query = route?.query || {};
  for (const key in query) {
    const val = query[key];

    switch (key) {
      case 'timeShortcut':
        if (typeof val === 'string') {
          cleanedValues.timeShortcut = val;
        }
        break;
      case 'radius':
        if (typeof val === 'string' || typeof val === 'number') {
          cleanedValues.radius = parseFloat(String(val));
          cleanedValues.locationFilter = LocationFilterTypes.WITHIN_RADIUS;
        }
        break;
      case 'placeName':
        if (typeof val === 'string') {
          cleanedValues.placeName = val;
        }
        break;
      case 'placeAddress':
        if (typeof val === 'string') {
          cleanedValues.placeAddress = val;
        }
        break;
      case 'latitude':
        if (typeof val === 'string') {
          // Cast string to number for filtering by distance
          const parsedVal = parseFloat(val);
          if (!isNaN(parsedVal)) {
            cleanedValues.latitude = parsedVal;
          }
        }
        break;
      case 'longitude':
        if (typeof val === 'string') {
          // Cast string to number for filtering by distance
          const parsedVal = parseFloat(val);
          if (!isNaN(parsedVal)) {
            cleanedValues.longitude = parsedVal;
          }
        }
        break;
      case 'tags':
        if (typeof val === 'string') {
          cleanedValues.tags = val.split(',');
        } else if (Array.isArray(val)) {
          // If it is an array of strings, which
          // is good, then the type is an object.
          cleanedValues.tags = val as string[];
        } else {
          cleanedValues.tags = [];
        }
        break;
      case 'channels':
        if (typeof val === 'string') {
          cleanedValues.channels = [val];
        }
        if (Array.isArray(val)) {
          // If it is an array of strings, which
          // is good, then the type is an object.
          cleanedValues.channels = val as string[];
        }
        break;
      case 'searchInput':
        if (typeof val === 'string') {
          cleanedValues.searchInput = val;
        }
        break;
      case 'showCanceledEvents':
        // May need to cast to boolean
        if (val === 'true') {
          cleanedValues.showCanceledEvents = true;
        } else if (val === 'false') {
          cleanedValues.showCanceledEvents = false;
        }
        break;
      case 'showOnlyFreeEvents':
        if (val === 'true') {
          cleanedValues.free = true;
        } else if (val === 'false') {
          cleanedValues.free = false;
        }
        break;
      case 'resultsOrder':
        if (val === resultOrderTypes.CHRONOLOGICAL) {
          cleanedValues.resultsOrder = chronologicalOrder;
        }
        if (val === resultOrderTypes.REVERSE_CHRONOLOGICAL) {
          cleanedValues.resultsOrder = reverseChronologicalOrder;
        }
        break;
      case 'locationFilter':
        cleanedValues.locationFilter = val?.toString();
        break;
      case 'showArchived':
        if (val === 'true') {
          cleanedValues.showArchived = true;
        } else if (val === 'false') {
          cleanedValues.showArchived = false;
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
    resultsOrder,
    locationFilter,
    hasVirtualEventUrl,
    showArchived,
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
    searchInput: searchInput || '',
    showCanceledEvents: showCanceledEvents || false,
    free: free || false,
    resultsOrder: resultsOrder || chronologicalOrder,
    hasVirtualEventUrl: hasVirtualEventUrl || false,
    showArchived: showArchived || false,
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
