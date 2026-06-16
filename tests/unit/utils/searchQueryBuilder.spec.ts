import { describe, it, expect } from 'vitest';
import {
  buildSearchQuery,
  toggleInArray,
  dedupeRecentSearches,
  type RecentSearch,
} from '@/utils/searchQueryBuilder';

const makeRecent = (overrides: Partial<RecentSearch> = {}): RecentSearch => ({
  query: 'cats',
  type: 'discussions',
  modified: 'all',
  forums: [],
  timestamp: 1,
  ...overrides,
});

describe('buildSearchQuery', () => {
  it('trims the search input', () => {
    const query = buildSearchQuery({
      searchInput: '  cats  ',
      selectedType: 'discussions',
      selectedModified: 'all',
      selectedForums: [],
    });
    expect(query.searchInput).toBe('cats');
  });

  it('omits an empty search input', () => {
    const query = buildSearchQuery({
      searchInput: '   ',
      selectedType: 'discussions',
      selectedModified: 'all',
      selectedForums: [],
    });
    expect(query.searchInput).toBeUndefined();
  });

  it('omits the modified range when it is the default "all"', () => {
    const query = buildSearchQuery({
      searchInput: 'cats',
      selectedType: 'discussions',
      selectedModified: 'all',
      selectedForums: [],
    });
    expect(query.modified).toBeUndefined();
  });

  it('includes a non-default modified range', () => {
    const query = buildSearchQuery({
      searchInput: 'cats',
      selectedType: 'discussions',
      selectedModified: 'last7',
      selectedForums: [],
    });
    expect(query.modified).toBe('last7');
  });

  it('omits channels when no forums are selected', () => {
    const query = buildSearchQuery({
      searchInput: 'cats',
      selectedType: 'discussions',
      selectedModified: 'all',
      selectedForums: [],
    });
    expect(query.channels).toBeUndefined();
  });

  it('includes a copy of the selected forums', () => {
    const query = buildSearchQuery({
      searchInput: 'cats',
      selectedType: 'discussions',
      selectedModified: 'all',
      selectedForums: ['a', 'b'],
    });
    expect(query.channels).toEqual(['a', 'b']);
  });

  it('always marks the search as open', () => {
    const query = buildSearchQuery({
      searchInput: 'cats',
      selectedType: 'forums',
      selectedModified: 'all',
      selectedForums: [],
    });
    expect(query.searchOpen).toBe('true');
  });
});

describe('toggleInArray', () => {
  it('adds a value that is not present', () => {
    expect(toggleInArray(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a value that is present', () => {
    expect(toggleInArray(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('does not mutate the original array', () => {
    const original = ['a'];
    toggleInArray(original, 'b');
    expect(original).toEqual(['a']);
  });
});

describe('dedupeRecentSearches', () => {
  it('removes duplicate searches keeping the first occurrence', () => {
    const list = [
      makeRecent({ timestamp: 2 }),
      makeRecent({ timestamp: 1 }),
    ];
    expect(dedupeRecentSearches(list, 6)).toHaveLength(1);
  });

  it('treats different forum sets as distinct', () => {
    const list = [
      makeRecent({ forums: ['a'] }),
      makeRecent({ forums: ['b'] }),
    ];
    expect(dedupeRecentSearches(list, 6)).toHaveLength(2);
  });

  it('caps the list at the maximum length', () => {
    const list = [
      makeRecent({ query: 'a' }),
      makeRecent({ query: 'b' }),
      makeRecent({ query: 'c' }),
    ];
    expect(dedupeRecentSearches(list, 2)).toHaveLength(2);
  });
});
