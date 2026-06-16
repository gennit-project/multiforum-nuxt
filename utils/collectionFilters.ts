/**
 * Pure helpers for AddToListPopover: deciding whether an item is already in the
 * user's favorites (channels key off uniqueName, everything else off id) and
 * filtering collections by a search term. Extracted from the component so they
 * can be unit-tested without mounting it.
 */

export type FavoriteItem = {
  id?: string | null;
  uniqueName?: string | null;
};

export type IsItemFavoritedParams = {
  itemType: string;
  itemId: string;
  /** When the parent already knows it's favorited, short-circuit to true. */
  isAlreadyFavorite?: boolean;
  favoriteItems?: FavoriteItem[] | null;
};

export function isItemFavorited(params: IsItemFavoritedParams): boolean {
  const { itemType, itemId, isAlreadyFavorite, favoriteItems } = params;
  if (isAlreadyFavorite) return true;
  const items = favoriteItems ?? [];
  if (itemType === 'channel') {
    return items.some((item) => item.uniqueName === itemId);
  }
  return items.some((item) => item.id === itemId);
}

export type FilterCollectionsParams<T> = {
  collections: T[];
  searchTerm: string;
};

export function filterCollectionsBySearch<T extends { name: string }>(
  params: FilterCollectionsParams<T>
): T[] {
  const { collections, searchTerm } = params;
  if (!searchTerm) return collections;
  const lower = searchTerm.toLowerCase();
  return collections.filter((collection) =>
    collection.name.toLowerCase().includes(lower)
  );
}
