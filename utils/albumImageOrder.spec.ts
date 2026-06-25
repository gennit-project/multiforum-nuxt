import { describe, it, expect } from 'vitest';
import {
  orderImagesByOrder,
  getImageIdOrder,
  moveImageOrderUp,
  moveImageOrderDown,
} from './albumImageOrder';

describe('orderImagesByOrder', () => {
  const images = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('returns images sorted by the id order', () => {
    expect(
      orderImagesByOrder({ images, imageOrder: ['c', 'a', 'b'] }).map((i) => i.id)
    ).toEqual(['c', 'a', 'b']);
  });

  it('keeps the original order when no imageOrder is set', () => {
    expect(orderImagesByOrder({ images, imageOrder: [] }).map((i) => i.id)).toEqual(
      ['a', 'b', 'c']
    );
  });

  it('drops ids in the order with no matching image', () => {
    expect(
      orderImagesByOrder({ images, imageOrder: ['c', 'missing', 'a'] }).map(
        (i) => i.id
      )
    ).toEqual(['c', 'a']);
  });

  it('returns an empty array for null images', () => {
    expect(orderImagesByOrder({ images: null, imageOrder: ['a'] })).toEqual([]);
  });
});

describe('getImageIdOrder', () => {
  it('returns the list of non-null image ids', () => {
    expect(
      getImageIdOrder([{ id: 'a' }, { id: null }, { id: 'b' }])
    ).toEqual(['a', 'b']);
  });
});

describe('moveImageOrderUp', () => {
  it('swaps an item with the one before it', () => {
    expect(moveImageOrderUp(['a', 'b', 'c'], 2)).toEqual(['a', 'c', 'b']);
  });

  it('is a no-op at the start', () => {
    expect(moveImageOrderUp(['a', 'b'], 0)).toEqual(['a', 'b']);
  });
});

describe('moveImageOrderDown', () => {
  it('swaps an item with the one after it', () => {
    expect(moveImageOrderDown(['a', 'b', 'c'], 0)).toEqual(['b', 'a', 'c']);
  });

  it('is a no-op at the end', () => {
    expect(moveImageOrderDown(['a', 'b'], 1)).toEqual(['a', 'b']);
  });
});
