import { describe, it, expect } from 'vitest';
import {
  SEARCH_ROUTES,
  buildSearchQuery,
  toggleSearchQuerySelection,
  dedupeRecentSearches,
  type RecentSearch,
} from './searchQueryBuilder';

describe('SEARCH_ROUTES', () => {
  it('maps the wiki type to its search route', () => {
    expect(SEARCH_ROUTES.wiki).toBe('/wiki/search');
  });
});

describe('buildSearchQuery', () => {
  const base = {
    searchInput: 'cats',
    selectedType: 'discussions' as const,
    selectedModified: 'all' as const,
    selectedForums: [] as string[],
  };

  it('trims the search input', () => {
    expect(buildSearchQuery({ ...base, searchInput: '  cats  ' }).searchInput).toBe(
      'cats'
    );
  });

  it('omits the search input when it is blank', () => {
    expect(
      buildSearchQuery({ ...base, searchInput: '   ' }).searchInput
    ).toBeUndefined();
  });

  it('omits the modified filter when set to "all"', () => {
    expect(buildSearchQuery(base).modified).toBeUndefined();
  });

  it('includes a non-default modified filter', () => {
    expect(
      buildSearchQuery({ ...base, selectedModified: 'last7' }).modified
    ).toBe('last7');
  });

  it('omits channels when no forums are selected', () => {
    expect(buildSearchQuery(base).channels).toBeUndefined();
  });

  it('includes selected forums as channels', () => {
    expect(
      buildSearchQuery({ ...base, selectedForums: ['cats', 'dogs'] }).channels
    ).toEqual(['cats', 'dogs']);
  });
});

describe('toggleSearchQuerySelection', () => {
  it('appends a value that is absent', () => {
    expect(toggleSearchQuerySelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a value that is present', () => {
    expect(toggleSearchQuerySelection(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('dedupeRecentSearches', () => {
  const make = (query: string): RecentSearch => ({
    query,
    type: 'discussions',
    modified: 'all',
    forums: [],
    timestamp: 0,
  });

  it('keeps the first occurrence of duplicates', () => {
    expect(
      dedupeRecentSearches([make('a'), make('a'), make('b')], 10).map(
        (s) => s.query
      )
    ).toEqual(['a', 'b']);
  });

  it('caps the list at the max length', () => {
    expect(
      dedupeRecentSearches([make('a'), make('b'), make('c')], 2)
    ).toHaveLength(2);
  });

  it('treats searches with different forum sets as distinct', () => {
    const a = { ...make('x'), forums: ['cats'] };
    const b = { ...make('x'), forums: ['dogs'] };
    expect(dedupeRecentSearches([a, b], 10)).toHaveLength(2);
  });
});
