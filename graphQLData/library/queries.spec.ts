import { describe, expect, it } from 'vitest';
import { print } from 'graphql';
import { GET_UNIFIED_LIBRARY_FAVORITES } from './queries';

describe('GET_UNIFIED_LIBRARY_FAVORITES', () => {
  it('uses the plural image Albums relationship from the schema', () => {
    const query = print(GET_UNIFIED_LIBRARY_FAVORITES);
    const favoriteImagesSelection = query.slice(
      query.indexOf('FavoriteImages'),
      query.indexOf('FavoriteComments')
    );
    expect(favoriteImagesSelection).toMatch(/\bAlbums\(options:/);
  });
});
