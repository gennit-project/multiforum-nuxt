/**
 * Pure helpers for the sitewide search in TopNavSearch: building the route
 * query, toggling a value in a selection array, and de-duplicating the
 * persisted "recent searches" list. Kept free of Vue/DOM so they can be
 * unit-tested directly.
 */

export type SearchType =
  | 'discussions'
  | 'comments'
  | 'downloads'
  | 'forums'
  | 'wiki'
  | 'eventsOnline'
  | 'eventsInPerson';

export type ModifiedRange =
  | 'all'
  | 'last7'
  | 'last30'
  | 'thisYear'
  | 'lastYear';

export type RecentSearch = {
  query: string;
  type: SearchType;
  modified: ModifiedRange;
  forums: string[];
  timestamp: number;
};

/** Route path for each search type. */
export const SEARCH_ROUTES: Record<SearchType, string> = {
  discussions: '/discussions',
  comments: '/comments/search',
  downloads: '/downloads',
  forums: '/forums',
  wiki: '/wiki/search',
  eventsOnline: '/events/list/search',
  eventsInPerson: '/map/search',
};

export type BuildSearchQueryParams = {
  searchInput: string;
  selectedType: SearchType;
  selectedModified: ModifiedRange;
  selectedForums: string[];
};

/**
 * Assemble the route query for a search, omitting empty/default values.
 */
export function buildSearchQuery(
  params: BuildSearchQueryParams
): Record<string, string | string[] | undefined> {
  const { searchInput, selectedType, selectedModified, selectedForums } =
    params;
  const trimmedInput = searchInput.trim();
  return {
    searchInput: trimmedInput || undefined,
    type: selectedType,
    searchOpen: 'true',
    modified: selectedModified === 'all' ? undefined : selectedModified,
    channels: selectedForums.length ? [...selectedForums] : undefined,
  };
}

/**
 * Return a new array with `value` removed if present, or appended if absent.
 */
export function toggleInArray<T>(array: T[], value: T): T[] {
  const index = array.indexOf(value);
  if (index === -1) {
    return [...array, value];
  }
  return array.filter((_, i) => i !== index);
}

/**
 * Two recent searches are considered the same when query, type, modified
 * range, and forum set all match.
 */
const isSameRecentSearch = (a: RecentSearch, b: RecentSearch): boolean =>
  a.query === b.query &&
  a.type === b.type &&
  a.modified === b.modified &&
  a.forums.join('|') === b.forums.join('|');

/**
 * De-duplicate recent searches (keeping the first occurrence) and cap the list
 * at `max` entries.
 */
export function dedupeRecentSearches(
  searches: RecentSearch[],
  max: number
): RecentSearch[] {
  const deduped = searches.filter((item, index, self) => {
    const matchIndex = self.findIndex((other) =>
      isSameRecentSearch(other, item)
    );
    return matchIndex === index;
  });
  return deduped.slice(0, max);
}
