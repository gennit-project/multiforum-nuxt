import type { LocationQuery } from "vue-router";

export const availableSortTypes: Record<string, string> = {
  HOT: "hot",
  NEW: "new",
  TOP: "top",
};

export const sortTypeIcons = {
  hot: "fa-fire",
  new: "fa-burst",
  top: "fa-arrow-up",
};

export const topSortTypes = {
  TOP_DAY: "day",
  TOP_WEEK: "week",
  TOP_MONTH: "month",
  TOP_YEAR: "year",
  TOP_ALL: "all",
};

export const commentSortTypes = {
  HOT: "HOT",
  NEW: "NEW",
  TOP: "TOP",
};

export const capitalizeCase = function (str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getSortFromQuery = function (query: LocationQuery): string {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  let sort = commentSortTypes.HOT;
  if (query) {
    if (typeof query.sort === "string") {
      sort = query.sort;
      return sort;
    }
  }
  return commentSortTypes.HOT.toLowerCase();
};

export const getTimeFrameFromQuery = function (query: LocationQuery): string {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  let timeFrame = topSortTypes.TOP_ALL;
  if (query) {
    if (typeof query.timeFrame === "string") {
      timeFrame = query.timeFrame;
      return timeFrame;
    }
  }
  return topSortTypes.TOP_MONTH.toLowerCase();
};
