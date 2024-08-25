import { SearchDiscussionValues } from "@/types/Discussion";

type GetFilterValuesInput = {
  route: any;
  channelId: string;
};

const getFilterValuesFromParams = function (
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
    }
  }

  const { tags, channels, searchInput } = cleanedValues;

  const filterValues: SearchDiscussionValues = {
    tags: tags || [],
    channels: channels || [],
    searchInput: searchInput || "",
  };
  return filterValues;
};

export default { getFilterValuesFromParams };
