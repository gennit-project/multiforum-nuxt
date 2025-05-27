import type { SearchDiscussionValues } from "@/types/Discussion";

type GetFilterValuesInput = {
  route: any;
  channelId: string;
};

export const getFilterValuesFromParams = function (
  input: GetFilterValuesInput,
): SearchDiscussionValues {
  // Need to re-clean data when route values change
  // Take the default filter values from the query
  // in the URL if the values exist.
  const { route, channelId } = input;
  const cleanedValues: SearchDiscussionValues = {
    tags: [],
    channels: channelId ? [channelId] : [],
    searchInput: "",
    showArchived: false,
  };

  for (const key in route?.query || {}) {
    const val = route.query[key];

    switch (key) {
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
      case "showArchived":
        if (val === "true") {
          cleanedValues.showArchived = true;
        }
        if (val === "false") {
          cleanedValues.showArchived = false;
        }
        break;
    }
  }

  const { tags, channels, searchInput, showArchived } = cleanedValues;

  const filterValues: SearchDiscussionValues = {
    tags: tags || [],
    channels: channels || [],
    searchInput: searchInput || "",
    showArchived,
  };
  return filterValues;
};

