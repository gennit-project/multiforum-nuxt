import { describe, it, expect } from 'vitest';
import { computeVisibleTabCount } from '@/utils/tabOverflow';

describe('computeVisibleTabCount', () => {
  it.each([
    {
      name: 'all tabs fit',
      tabWidths: [100, 100, 100],
      moreWidth: 80,
      containerWidth: 300,
      expected: 3,
    },
    {
      name: 'reserves room for More when overflowing',
      tabWidths: [100, 100, 100],
      moreWidth: 80,
      containerWidth: 290,
      expected: 2,
    },
    {
      name: 'only fits some tabs',
      tabWidths: [100, 100, 100, 100],
      moreWidth: 80,
      containerWidth: 250,
      expected: 1,
    },
    {
      name: 'nothing fits',
      tabWidths: [100, 100],
      moreWidth: 80,
      containerWidth: 50,
      expected: 0,
    },
    {
      name: 'zero-width (unmeasured) container',
      tabWidths: [0, 0],
      moreWidth: 0,
      containerWidth: 0,
      expected: 2,
    },
  ])('$name', ({ tabWidths, moreWidth, containerWidth, expected }) => {
    expect(
      computeVisibleTabCount({ tabWidths, moreWidth, containerWidth })
    ).toBe(expected);
  });
});
