import { describe, it, expect } from 'vitest';
import {
  orderImagesByOrder,
  getImageIdOrder,
  moveImageOrderUp,
  moveImageOrderDown,
} from '@/utils/albumImageOrder';

const img = (id: string) => ({ id });

describe('orderImagesByOrder', () => {
  it('returns an empty array when there are no images', () => {
    expect(orderImagesByOrder({ images: null, imageOrder: ['a'] })).toEqual([]);
  });

  it('returns the original order when no imageOrder is set', () => {
    const images = [img('a'), img('b')];
    expect(orderImagesByOrder({ images, imageOrder: [] })).toBe(images);
  });

  it('orders images according to imageOrder', () => {
    const images = [img('a'), img('b'), img('c')];
    expect(
      orderImagesByOrder({ images, imageOrder: ['c', 'a', 'b'] }).map(
        (i) => i.id
      )
    ).toEqual(['c', 'a', 'b']);
  });

  it('drops order ids that have no matching image', () => {
    const images = [img('a')];
    expect(
      orderImagesByOrder({ images, imageOrder: ['missing', 'a'] }).map(
        (i) => i.id
      )
    ).toEqual(['a']);
  });
});

describe('getImageIdOrder', () => {
  it('extracts the ids in order', () => {
    expect(getImageIdOrder([img('a'), img('b')])).toEqual(['a', 'b']);
  });

  it('skips images without an id', () => {
    expect(getImageIdOrder([{ id: 'a' }, {}, { id: null }])).toEqual(['a']);
  });
});

describe('moveImageOrderUp', () => {
  it('swaps the item with the previous one', () => {
    expect(moveImageOrderUp(['a', 'b', 'c'], 1)).toEqual(['b', 'a', 'c']);
  });

  it('is a no-op at the start', () => {
    expect(moveImageOrderUp(['a', 'b'], 0)).toEqual(['a', 'b']);
  });

  it('does not mutate the input', () => {
    const order = ['a', 'b'];
    moveImageOrderUp(order, 1);
    expect(order).toEqual(['a', 'b']);
  });
});

describe('moveImageOrderDown', () => {
  it('swaps the item with the next one', () => {
    expect(moveImageOrderDown(['a', 'b', 'c'], 1)).toEqual(['a', 'c', 'b']);
  });

  it('is a no-op at the end', () => {
    expect(moveImageOrderDown(['a', 'b'], 1)).toEqual(['a', 'b']);
  });
});
