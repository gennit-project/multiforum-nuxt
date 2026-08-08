import { describe, expect, it } from 'vitest';
import { canOptimizeImageUrl } from './imageOptimization';

describe('canOptimizeImageUrl', () => {
  it('optimizes same-origin paths', () => {
    expect(canOptimizeImageUrl('/images/cat.jpg')).toBe(true);
  });

  it('optimizes storage.googleapis.com URLs', () => {
    expect(
      canOptimizeImageUrl('https://storage.googleapis.com/bucket/cat.jpg')
    ).toBe(true);
  });

  it('does not optimize arbitrary external hosts', () => {
    expect(canOptimizeImageUrl('https://example.com/cat.jpg')).toBe(false);
  });

  it('does not optimize data URLs', () => {
    expect(canOptimizeImageUrl('data:image/png;base64,abc')).toBe(false);
  });

  it('does not optimize empty strings', () => {
    expect(canOptimizeImageUrl('')).toBe(false);
  });
});
