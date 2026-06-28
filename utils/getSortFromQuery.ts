import type { LocationQuery } from 'vue-router';
import { SortType, TimeFrame } from '@/__generated__/graphql';

export const availableSortTypes: Record<string, string> = {
  HOT: 'hot',
  NEW: 'new',
  TOP: 'top',
};

export const sortTypeIcons = {
  hot: 'fa-fire',
  new: 'fa-burst',
  top: 'fa-arrow-up',
};

export const topSortTypes = {
  TOP_DAY: 'day',
  TOP_WEEK: 'week',
  TOP_MONTH: 'month',
  TOP_YEAR: 'year',
  TOP_ALL: 'all',
};

export const commentSortTypes = {
  HOT: 'HOT',
  NEW: 'NEW',
  TOP: 'TOP',
};

export const capitalizeCase = function (str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const validSortTypes = new Set<string>(Object.values(SortType));
const validTimeFrames = new Set<string>(Object.values(TimeFrame));

export const getSortFromQuery = function (query: LocationQuery): SortType {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  if (query && typeof query.sort === 'string') {
    const sortValue = query.sort.toLowerCase();
    if (validSortTypes.has(sortValue)) {
      return sortValue as SortType;
    }
  }
  return SortType.Hot;
};

export const getTimeFrameFromQuery = function (query: LocationQuery): TimeFrame {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  if (query && typeof query.timeFrame === 'string') {
    const timeFrameValue = query.timeFrame.toLowerCase();
    if (validTimeFrames.has(timeFrameValue)) {
      return timeFrameValue as TimeFrame;
    }
  }
  return TimeFrame.Month;
};
