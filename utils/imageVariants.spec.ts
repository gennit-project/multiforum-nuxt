import { describe, expect, it } from 'vitest';
import {
  extractImageVariantUrls,
  getOriginalImageUrl,
  getPreferredImageUrl,
} from './imageVariants';

describe('extractImageVariantUrls', () => {
  it('reads a variantUrls object', () => {
    expect(
      extractImageVariantUrls({
        variantUrls: {
          list320: 'https://img.test/list-320.webp',
          detail960: 'https://img.test/detail-960.webp',
        },
      })
    ).toEqual({
      list320: 'https://img.test/list-320.webp',
      detail960: 'https://img.test/detail-960.webp',
    });
  });

  it('reads imageVariants arrays keyed by name', () => {
    expect(
      extractImageVariantUrls({
        imageVariants: [
          { name: 'list160', url: 'https://img.test/list-160.webp' },
          { key: 'detail640', url: 'https://img.test/detail-640.webp' },
        ],
      })
    ).toEqual({
      list160: 'https://img.test/list-160.webp',
      detail640: 'https://img.test/detail-640.webp',
    });
  });

  it('reads direct variant aliases', () => {
    expect(
      extractImageVariantUrls({
        thumbnailUrl: 'https://img.test/thumb.webp',
        detail1280Url: 'https://img.test/detail-1280.webp',
      })
    ).toEqual({
      list80: 'https://img.test/thumb.webp',
      detail1280: 'https://img.test/detail-1280.webp',
    });
  });
});

describe('getOriginalImageUrl', () => {
  it('returns direct string inputs', () => {
    expect(getOriginalImageUrl('https://img.test/original.jpg')).toBe(
      'https://img.test/original.jpg'
    );
  });

  it('reads url-like fields from objects', () => {
    expect(
      getOriginalImageUrl({ coverImageURL: 'https://img.test/original.jpg' })
    ).toBe('https://img.test/original.jpg');
  });
});

describe('getPreferredImageUrl', () => {
  it('prefers matching variants over the original url', () => {
    expect(
      getPreferredImageUrl({
        source: {
          url: 'https://img.test/original.jpg',
          variantUrls: {
            list160: 'https://img.test/list-160.webp',
            list320: 'https://img.test/list-320.webp',
          },
        },
        preferred: ['list320', 'list160'],
      })
    ).toBe('https://img.test/list-320.webp');
  });

  it('falls back to the original url when variants are absent', () => {
    expect(
      getPreferredImageUrl({
        source: { url: 'https://img.test/original.jpg' },
        preferred: ['detail960'],
      })
    ).toBe('https://img.test/original.jpg');
  });

  it('skips empty variant values', () => {
    expect(
      getPreferredImageUrl({
        source: {
          url: 'https://img.test/original.jpg',
          variantUrls: {
            list320: '',
            list160: 'https://img.test/list-160.webp',
          },
        },
        preferred: ['list320', 'list160'],
      })
    ).toBe('https://img.test/list-160.webp');
  });
});
