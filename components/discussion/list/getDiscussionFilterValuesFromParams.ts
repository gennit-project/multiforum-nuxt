import type { SearchDiscussionValues } from '@/types/Discussion';
import type { RouteLocationNormalized } from 'vue-router';

type GetFilterValuesInput = {
  route: RouteLocationNormalized;
  channelId: string;
};

export const getFilterValuesFromParams = function (
  input: GetFilterValuesInput
): SearchDiscussionValues {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  const { route, channelId } = input;
  const cleanedValues: SearchDiscussionValues = {
    tags: [],
    channels: channelId ? [channelId] : [],
    searchInput: '',
    showArchived: false,
    showUnanswered: false,
  };

  for (const key in route?.query || {}) {
    const val = route.query[key];

    switch (key) {
      case 'tags':
        if (typeof val === 'string') {
          cleanedValues.tags = [val];
        }
        if (Array.isArray(val)) {
          // If it is an array of strings, which
          // is good, then the type is an object.
          cleanedValues.tags = val.filter(
            (v): v is string => typeof v === 'string'
          );
        }
        break;
      case 'channels':
        if (typeof val === 'string') {
          cleanedValues.channels = [val];
        }
        if (Array.isArray(val)) {
          // If it is an array of strings, which
          // is good, then the type is an object.
          cleanedValues.channels = val.filter(
            (v): v is string => typeof v === 'string'
          );
        }
        break;
      case 'searchInput':
        if (typeof val === 'string') {
          cleanedValues.searchInput = val;
        }
        break;
      case 'showArchived':
        if (val === 'true') {
          cleanedValues.showArchived = true;
        }
        if (val === 'false') {
          cleanedValues.showArchived = false;
        }
        break;
      case 'showUnanswered':
        if (val === 'true') {
          cleanedValues.showUnanswered = true;
        }
        if (val === 'false') {
          cleanedValues.showUnanswered = false;
        }
        break;
    }
  }

  const { tags, channels, searchInput, showArchived, showUnanswered } =
    cleanedValues;

  const filterValues: SearchDiscussionValues = {
    tags: tags || [],
    channels: channels || [],
    searchInput: searchInput || '',
    showArchived,
    showUnanswered,
  };
  return filterValues;
};
