import { describe, it, expect } from 'vitest';
import {
  mapAlbumImagesToForm,
  getInitialImageOrder,
  type AlbumFormImage,
} from '@/utils/albumImages';

const formImage = (id: string): AlbumFormImage => ({
  id,
  url: '',
  alt: '',
  caption: '',
  isCoverImage: false,
  hasSensitiveContent: false,
  hasSpoiler: false,
  copyright: '',
});

describe('mapAlbumImagesToForm', () => {
  it('returns an empty array when there are no images', () => {
    expect(mapAlbumImagesToForm(null)).toEqual([]);
  });

  it('maps source fields and defaults missing ones', () => {
    expect(
      mapAlbumImagesToForm([{ id: 'a', url: 'u', caption: 'c' }])
    ).toEqual([
      {
        id: 'a',
        url: 'u',
        alt: '',
        caption: 'c',
        isCoverImage: false,
        hasSensitiveContent: false,
        hasSpoiler: false,
        copyright: '',
      },
    ]);
  });
});

describe('getInitialImageOrder', () => {
  it('uses the existing album order when present', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: ['b', 'a'],
        images: [formImage('a'), formImage('b')],
      })
    ).toEqual(['b', 'a']);
  });

  it('filters non-string ids out of the existing order', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: ['a', null, undefined],
        images: [formImage('a')],
      })
    ).toEqual(['a']);
  });

  it('falls back to image ids when no order is stored', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: [],
        images: [formImage('a'), formImage('b')],
      })
    ).toEqual(['a', 'b']);
  });

  it('skips images with an empty id in the fallback', () => {
    expect(
      getInitialImageOrder({
        albumImageOrder: null,
        images: [formImage(''), formImage('b')],
      })
    ).toEqual(['b']);
  });
});
