import { describe, expect, it } from 'vitest';
import { getRemovedAlbumImageIds } from './albumImageDisconnections';

describe('getRemovedAlbumImageIds', () => {
  it('returns existing image ids missing from the edited album', () => {
    expect(
      getRemovedAlbumImageIds({
        existingImages: [{ id: 'one' }, { id: 'two' }, { id: 'three' }],
        currentImages: [{ id: 'one' }, { id: 'two' }],
      })
    ).toEqual(['three']);
  });

  it('ignores missing ids and removes duplicate disconnections', () => {
    expect(
      getRemovedAlbumImageIds({
        existingImages: [{ id: 'gone' }, { id: null }, { id: 'gone' }],
        currentImages: [],
      })
    ).toEqual(['gone']);
  });
});
