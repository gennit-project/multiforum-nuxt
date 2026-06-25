import { describe, it, expect } from 'vitest';
import { isItemFavorited, filterCollectionsBySearch } from './collectionFilters';

describe('isItemFavorited', () => {
  it('short-circuits to true when already known to be favorited', () => {
    expect(
      isItemFavorited({ itemType: 'channel', itemId: 'cats', isAlreadyFavorite: true })
    ).toBe(true);
  });

  it('matches channels on uniqueName', () => {
    expect(
      isItemFavorited({
        itemType: 'channel',
        itemId: 'cats',
        favoriteItems: [{ uniqueName: 'cats' }],
      })
    ).toBe(true);
  });

  it('matches non-channel items on id', () => {
    expect(
      isItemFavorited({
        itemType: 'discussion',
        itemId: 'd1',
        favoriteItems: [{ id: 'd1' }],
      })
    ).toBe(true);
  });

  it('returns false when the item is not in favorites', () => {
    expect(
      isItemFavorited({ itemType: 'discussion', itemId: 'd2', favoriteItems: [{ id: 'd1' }] })
    ).toBe(false);
  });
});

describe('filterCollectionsBySearch', () => {
  const collections = [{ name: 'Favorites' }, { name: 'Wishlist' }];

  it('returns all collections for an empty term', () => {
    expect(filterCollectionsBySearch({ collections, searchTerm: '' })).toBe(
      collections
    );
  });

  it('filters by a case-insensitive name match', () => {
    expect(
      filterCollectionsBySearch({ collections, searchTerm: 'wish' })
    ).toEqual([{ name: 'Wishlist' }]);
  });
});
