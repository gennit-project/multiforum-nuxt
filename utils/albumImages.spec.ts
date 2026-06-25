import { describe, it, expect } from 'vitest';
import { mapAlbumImagesToForm, getInitialImageOrder } from './albumImages';

describe('mapAlbumImagesToForm', () => {
  it('returns an empty array for nullish input', () => {
    expect(mapAlbumImagesToForm(null)).toEqual([]);
  });

  it('maps stored images into the form shape with defaults', () => {
    expect(
      mapAlbumImagesToForm([{ id: 'i1', url: 'u', alt: 'a' }])[0]
    ).toEqual({
      id: 'i1',
      url: 'u',
      alt: 'a',
      caption: '',
      isCoverImage: false,
      hasSensitiveContent: false,
      hasSpoiler: false,
      copyright: '',
    });
  });
});

describe('getInitialImageOrder', () => {
  it('uses the stored order when present', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: ['i2', 'i1'],
        images: [],
      })
    ).toEqual(['i2', 'i1']);
  });

  it('filters out non-string ids from the stored order', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: ['i1', null, undefined],
        images: [],
      })
    ).toEqual(['i1']);
  });

  it('derives the order from image ids when no stored order exists', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: [],
        images: [
          { id: 'i1' },
          { id: '' },
          { id: 'i2' },
        ] as Parameters<typeof getInitialImageOrder>[0]['images'],
      })
    ).toEqual(['i1', 'i2']);
  });
});
