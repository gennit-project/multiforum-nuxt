import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';
import { useRecentSearches } from './useRecentSearches';
import type { RecentSearch } from '@/utils/searchQueryBuilder';

vi.mock('@/utils/localStorageUtils', () => ({
  getLocalStorageItem: vi.fn(),
  setLocalStorageItem: vi.fn(),
}));

const getMock = getLocalStorageItem as unknown as ReturnType<typeof vi.fn>;
const setMock = setLocalStorageItem as unknown as ReturnType<typeof vi.fn>;

const makeRecent = (overrides: Partial<RecentSearch> = {}): RecentSearch => ({
  query: 'cats',
  type: 'discussions',
  modified: 'all',
  forums: [],
  timestamp: 1,
  ...overrides,
});

describe('useRecentSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load', () => {
    it('hydrates recent searches from storage', () => {
      const stored = [makeRecent()];
      getMock.mockReturnValue(stored);
      const { recentSearches, load } = useRecentSearches();
      load();
      expect(recentSearches.value).toEqual(stored);
    });

    it('reads from the provided storage key', () => {
      getMock.mockReturnValue([]);
      const { load } = useRecentSearches({ storageKey: 'customKey' });
      load();
      expect(getMock).toHaveBeenCalledWith('customKey', []);
    });
  });

  describe('record', () => {
    it('prepends the new search to the list', () => {
      getMock.mockReturnValue([makeRecent({ query: 'dogs' })]);
      const { recentSearches, load, record } = useRecentSearches();
      load();
      record(makeRecent({ query: 'cats' }));
      expect(recentSearches.value[0]?.query).toBe('cats');
    });

    it('persists the updated list to storage', () => {
      const { record } = useRecentSearches({ storageKey: 'customKey' });
      const recent = makeRecent();
      record(recent);
      expect(setMock).toHaveBeenCalledWith('customKey', [recent]);
    });

    it('de-duplicates identical searches', () => {
      const { recentSearches, record } = useRecentSearches();
      record(makeRecent({ timestamp: 1 }));
      record(makeRecent({ timestamp: 2 }));
      expect(recentSearches.value).toHaveLength(1);
    });

    it('caps the list at the configured maximum', () => {
      const { recentSearches, record } = useRecentSearches({ maxRecents: 2 });
      record(makeRecent({ query: 'a' }));
      record(makeRecent({ query: 'b' }));
      record(makeRecent({ query: 'c' }));
      expect(recentSearches.value).toHaveLength(2);
    });
  });
});
