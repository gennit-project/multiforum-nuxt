import { ref } from 'vue';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';
import {
  dedupeRecentSearches,
  type RecentSearch,
} from '@/utils/searchQueryBuilder';

const DEFAULT_STORAGE_KEY = 'sitewideSearchRecents';
const DEFAULT_MAX_RECENTS = 6;

export type UseRecentSearchesOptions = {
  storageKey?: string;
  maxRecents?: number;
};

/**
 * Manages the persisted list of recent sitewide searches. The storage key and
 * cap are injectable so the composable can be unit-tested in isolation.
 */
export function useRecentSearches(options: UseRecentSearchesOptions = {}) {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const maxRecents = options.maxRecents ?? DEFAULT_MAX_RECENTS;

  const recentSearches = ref<RecentSearch[]>([]);

  /** Load recent searches from local storage into reactive state. */
  const load = () => {
    recentSearches.value = getLocalStorageItem<RecentSearch[]>(storageKey, []);
  };

  /** Prepend a search, de-duplicate, cap, and persist. */
  const record = (recent: RecentSearch) => {
    const next = dedupeRecentSearches(
      [recent, ...recentSearches.value],
      maxRecents
    );
    recentSearches.value = next;
    setLocalStorageItem(storageKey, next);
  };

  return {
    recentSearches,
    load,
    record,
  };
}
