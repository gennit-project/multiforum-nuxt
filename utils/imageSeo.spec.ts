import { describe, it, expect } from 'vitest';
import { buildImageHead } from './imageSeo';

const uploader = { username: 'alice', displayName: 'Alice' };

describe('buildImageHead', () => {
  it.each([
    [null, uploader],
    [{ url: 'u' }, null],
  ])('returns a not-found head when data is missing', (image, who) => {
    expect(buildImageHead({ image, uploader: who, serverDisplayName: 'Topical' }).title).toBe('Image Not Found');
  });

  it('titles the image with its caption and uploader', () => {
    expect(
      buildImageHead({ image: { caption: 'A porch' }, uploader, serverDisplayName: 'Topical' }).title
    ).toBe('A porch by Alice | Topical');
  });

  it('builds a plain-text description from the caption and long description', () => {
    const head = buildImageHead({
      image: { alt: 'A porch', longDescription: 'Built with **cedar**' },
      uploader,
      serverDisplayName: 'Topical',
    });
    expect(head.meta.find((m) => m.name === 'description')?.content).toBe(
      'Image uploaded by Alice: A porch. Built with cedar'
    );
  });
});
