import { describe, it, expect } from 'vitest';
import {
  isItemFavorited,
  filterCollectionsBySearch,
} from '@/utils/collectionFilters';

describe('isItemFavorited', () => {
  it('is true when isAlreadyFavorite is set, regardless of the list', () => {
    expect(
      isItemFavorited({
        itemType: 'discussion',
        itemId: '1',
        isAlreadyFavorite: true,
        favoriteItems: [],
      })
    ).toBe(true);
  });

  it('matches channels by uniqueName', () => {
    expect(
      isItemFavorited({
        itemType: 'channel',
        itemId: 'cats',
        favoriteItems: [{ uniqueName: 'cats' }],
      })
    ).toBe(true);
  });

  it('does not match a channel by id', () => {
    expect(
      isItemFavorited({
        itemType: 'channel',
        itemId: 'cats',
        favoriteItems: [{ id: 'cats' }],
      })
    ).toBe(false);
  });

  it('matches non-channel items by id', () => {
    expect(
      isItemFavorited({
        itemType: 'discussion',
        itemId: 'd1',
        favoriteItems: [{ id: 'd1' }],
      })
    ).toBe(true);
  });

  it('is false when the item is absent', () => {
    expect(
      isItemFavorited({
        itemType: 'discussion',
        itemId: 'd1',
        favoriteItems: [{ id: 'd2' }],
      })
    ).toBe(false);
  });

  it('is false when the favorites list is missing', () => {
    expect(
      isItemFavorited({ itemType: 'discussion', itemId: 'd1' })
    ).toBe(false);
  });
});

describe('filterCollectionsBySearch', () => {
  const collections = [{ name: 'Recipes' }, { name: 'Travel Notes' }];

  it('returns all collections when the search term is empty', () => {
    expect(
      filterCollectionsBySearch({ collections, searchTerm: '' })
    ).toEqual(collections);
  });

  it('filters by a case-insensitive name match', () => {
    expect(
      filterCollectionsBySearch({ collections, searchTerm: 'travel' }).map(
        (c) => c.name
      )
    ).toEqual(['Travel Notes']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(
      filterCollectionsBySearch({ collections, searchTerm: 'zzz' })
    ).toEqual([]);
  });
});
