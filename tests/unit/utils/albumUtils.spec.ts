import { describe, it, expect } from 'vitest';
import {
  getMainImageHeight,
  getExpandedThumbnailDimensions,
  getOrderedAlbumImages,
  getFirstAlbumImage,
  navigateCarousel,
  detectSwipeDirection,
} from '@/utils/albumUtils';
import type { Album, Image } from '@/__generated__/graphql';

describe('albumUtils', () => {
  describe('getMainImageHeight', () => {
    it('returns 256 when not in expanded view', () => {
      expect(
        getMainImageHeight({ expandedView: false, downloadMode: false })
      ).toBe(256);
    });

    it('returns 256 when not in expanded view even with download mode', () => {
      expect(
        getMainImageHeight({ expandedView: false, downloadMode: true })
      ).toBe(256);
    });

    it('returns 400 when in expanded view but not download mode', () => {
      expect(
        getMainImageHeight({ expandedView: true, downloadMode: false })
      ).toBe(400);
    });

    it('returns 500 when in expanded view and download mode', () => {
      expect(
        getMainImageHeight({ expandedView: true, downloadMode: true })
      ).toBe(500);
    });
  });

  describe('getExpandedThumbnailDimensions', () => {
    it('returns 120x120 when not in expanded view', () => {
      expect(
        getExpandedThumbnailDimensions({ expandedView: false, downloadMode: false })
      ).toEqual({ width: 120, height: 120 });
    });

    it('returns 180x120 when in expanded view but not download mode', () => {
      expect(
        getExpandedThumbnailDimensions({ expandedView: true, downloadMode: false })
      ).toEqual({ width: 180, height: 120 });
    });

    it('returns 120x120 when in expanded view and download mode', () => {
      expect(
        getExpandedThumbnailDimensions({ expandedView: true, downloadMode: true })
      ).toEqual({ width: 120, height: 120 });
    });
  });

  describe('getOrderedAlbumImages', () => {
    it('returns empty array when album is null', () => {
      expect(getOrderedAlbumImages({ album: null })).toEqual([]);
    });

    it('returns images in original order when no imageOrder is specified', () => {
      const images = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
      ] as unknown as Image[];
      const album = { Images: images, imageOrder: [] } as unknown as Album;

      const result = getOrderedAlbumImages({ album });
      expect(result.map((img) => img.id)).toEqual(['1', '2']);
    });

    it('returns images ordered according to imageOrder', () => {
      const images = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
        { id: '3', url: 'url3' },
      ] as unknown as Image[];
      const album = { Images: images, imageOrder: ['3', '1', '2'] } as unknown as Album;

      const result = getOrderedAlbumImages({ album });
      expect(result.map((img) => img.id)).toEqual(['3', '1', '2']);
    });

    it('filters out missing images from imageOrder', () => {
      const images = [
        { id: '1', url: 'url1' },
        { id: '2', url: 'url2' },
      ] as unknown as Image[];
      const album = { Images: images, imageOrder: ['3', '1', '2'] } as unknown as Album;

      const result = getOrderedAlbumImages({ album });
      expect(result.map((img) => img.id)).toEqual(['1', '2']);
    });

    it('appends STL files as synthetic images', () => {
      const images = [{ id: '1', url: 'url1' }] as unknown as Image[];
      const album = { Images: images, imageOrder: [] } as unknown as Album;
      const stlFiles = [
        { id: 'stl1', url: 'model.stl', fileName: 'model.stl' },
      ];

      const result = getOrderedAlbumImages({ album, stlFiles });
      expect(result).toHaveLength(2);
      expect(result[1]!.id).toBe('stl-stl1');
      expect(result[1]!.isStlFile).toBe(true);
    });

    it('generates STL IDs from index when id is not provided', () => {
      const stlFiles = [{ url: 'model.stl', fileName: 'model.stl' }];

      const result = getOrderedAlbumImages({ album: null, stlFiles });
      expect(result[0]!.id).toBe('stl-0');
    });
  });

  describe('getFirstAlbumImage', () => {
    it('returns null for null album', () => {
      expect(getFirstAlbumImage(null)).toBeNull();
    });

    it('returns null for undefined album', () => {
      expect(getFirstAlbumImage(undefined)).toBeNull();
    });

    it('returns null for album with no images', () => {
      const album = { Images: [] } as unknown as Album;
      expect(getFirstAlbumImage(album)).toBeNull();
    });

    it('returns first image URL when no imageOrder is specified', () => {
      const album = {
        Images: [
          { id: '1', url: 'url1' },
          { id: '2', url: 'url2' },
        ],
        imageOrder: [],
      } as unknown as unknown as Album;

      expect(getFirstAlbumImage(album)).toBe('url1');
    });

    it('returns first ordered image URL when imageOrder is specified', () => {
      const album = {
        Images: [
          { id: '1', url: 'url1' },
          { id: '2', url: 'url2' },
        ],
        imageOrder: ['2', '1'],
      } as unknown as unknown as Album;

      expect(getFirstAlbumImage(album)).toBe('url2');
    });

    it('falls back to first image when ordered image not found', () => {
      const album = {
        Images: [
          { id: '1', url: 'url1' },
          { id: '2', url: 'url2' },
        ],
        imageOrder: ['3', '1'],
      } as unknown as unknown as Album;

      expect(getFirstAlbumImage(album)).toBe('url1');
    });
  });

  describe('navigateCarousel', () => {
    it('returns 0 when totalImages is 0', () => {
      expect(
        navigateCarousel({ currentIndex: 0, totalImages: 0, direction: 'left' })
      ).toBe(0);
    });

    it('wraps to last image when going left from first', () => {
      expect(
        navigateCarousel({ currentIndex: 0, totalImages: 5, direction: 'left' })
      ).toBe(4);
    });

    it('goes to previous image when going left', () => {
      expect(
        navigateCarousel({ currentIndex: 3, totalImages: 5, direction: 'left' })
      ).toBe(2);
    });

    it('wraps to first image when going right from last', () => {
      expect(
        navigateCarousel({ currentIndex: 4, totalImages: 5, direction: 'right' })
      ).toBe(0);
    });

    it('goes to next image when going right', () => {
      expect(
        navigateCarousel({ currentIndex: 2, totalImages: 5, direction: 'right' })
      ).toBe(3);
    });
  });

  describe('detectSwipeDirection', () => {
    it('returns null when swipe distance is below threshold', () => {
      expect(detectSwipeDirection({ startX: 100, endX: 130 })).toBeNull();
    });

    it('returns "left" when swiping right (positive distance)', () => {
      expect(detectSwipeDirection({ startX: 100, endX: 200 })).toBe('left');
    });

    it('returns "right" when swiping left (negative distance)', () => {
      expect(detectSwipeDirection({ startX: 200, endX: 100 })).toBe('right');
    });

    it('uses custom threshold when provided', () => {
      expect(
        detectSwipeDirection({ startX: 100, endX: 130, threshold: 20 })
      ).toBe('left');
    });

    it('returns null when exactly at threshold', () => {
      expect(
        detectSwipeDirection({ startX: 100, endX: 150, threshold: 50 })
      ).toBeNull();
    });
  });
});
