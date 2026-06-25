import { describe, it, expect } from 'vitest';
import type { Album } from '@/__generated__/graphql';
import {
  getMainImageHeight,
  getExpandedThumbnailDimensions,
  getFirstAlbumImage,
} from './albumUtils';

describe('getMainImageHeight', () => {
  it('uses the compact height when not in expanded view', () => {
    expect(getMainImageHeight({ expandedView: false, downloadMode: true })).toBe(
      256
    );
  });

  it('is tallest for expanded download mode', () => {
    expect(getMainImageHeight({ expandedView: true, downloadMode: true })).toBe(
      500
    );
  });

  it('is medium for expanded non-download mode', () => {
    expect(
      getMainImageHeight({ expandedView: true, downloadMode: false })
    ).toBe(400);
  });
});

describe('getExpandedThumbnailDimensions', () => {
  it('uses wide thumbnails only for expanded non-download mode', () => {
    expect(
      getExpandedThumbnailDimensions({ expandedView: true, downloadMode: false })
    ).toEqual({ width: 180, height: 120 });
  });

  it('uses square thumbnails otherwise', () => {
    expect(
      getExpandedThumbnailDimensions({ expandedView: true, downloadMode: true })
    ).toEqual({ width: 120, height: 120 });
  });
});

describe('getFirstAlbumImage', () => {
  it('returns null when the album has no images', () => {
    expect(getFirstAlbumImage({ Images: [] } as unknown as Album)).toBeNull();
  });

  it('returns null for a null album', () => {
    expect(getFirstAlbumImage(null)).toBeNull();
  });

  it('uses the first image in imageOrder when it has a url', () => {
    const album = {
      imageOrder: ['b', 'a'],
      Images: [
        { id: 'a', url: 'a.png' },
        { id: 'b', url: 'b.png' },
      ],
    } as unknown as Album;
    expect(getFirstAlbumImage(album)).toBe('b.png');
  });

  it('falls back to the first stored image when the ordered image has no url', () => {
    const album = {
      imageOrder: ['b'],
      Images: [
        { id: 'a', url: 'a.png' },
        { id: 'b', url: '' },
      ],
    } as unknown as Album;
    expect(getFirstAlbumImage(album)).toBe('a.png');
  });

  it('uses the first stored image when there is no imageOrder', () => {
    const album = {
      Images: [{ id: 'a', url: 'a.png' }],
    } as unknown as Album;
    expect(getFirstAlbumImage(album)).toBe('a.png');
  });
});
