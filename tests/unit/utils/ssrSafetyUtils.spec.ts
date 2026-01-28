import { describe, it, expect } from 'vitest';
import {
  safeArrayFirst,
  safeArrayLength,
  ensureArray,
  safeGet,
  isClient,
  clientOnly,
  validateDiscussionData,
  validateEventData,
} from '@/utils/ssrSafetyUtils';

describe('ssrSafetyUtils', () => {
  it.each([
    {
      name: 'returns first item when array has values',
      input: [1, 2, 3],
      fallback: null,
      expected: 1,
    },
    {
      name: 'returns fallback when array is empty',
      input: [] as number[],
      fallback: 5,
      expected: 5,
    },
    {
      name: 'returns fallback when array is null',
      input: null as number[] | null,
      fallback: 7,
      expected: 7,
    },
    {
      name: 'returns fallback when first item is undefined',
      input: [undefined] as Array<number | undefined>,
      fallback: 9,
      expected: 9,
    },
  ])('safeArrayFirst $name', ({ input, fallback, expected }) => {
    const result = safeArrayFirst(input as any, fallback as any);

    expect(result).toBe(expected as any);
  });

  it.each([
    {
      name: 'returns length for arrays',
      input: [1, 2, 3],
      fallback: 0,
      expected: 3,
    },
    {
      name: 'returns fallback for null',
      input: null,
      fallback: 2,
      expected: 2,
    },
    {
      name: 'returns fallback for undefined',
      input: undefined,
      fallback: 4,
      expected: 4,
    },
  ])('safeArrayLength $name', ({ input, fallback, expected }) => {
    const result = safeArrayLength(input as any, fallback);

    expect(result).toBe(expected);
  });

  it.each([
    {
      name: 'returns the same array when provided',
      input: ['a', 'b'],
      expected: ['a', 'b'],
    },
    {
      name: 'returns empty array for null',
      input: null,
      expected: [],
    },
    {
      name: 'returns empty array for undefined',
      input: undefined,
      expected: [],
    },
  ])('ensureArray $name', ({ input, expected }) => {
    const result = ensureArray(input as any);

    expect(result).toEqual(expected);
  });

  it.each([
    {
      name: 'returns nested value for valid path',
      obj: { a: { b: { c: 3 } } },
      path: 'a.b.c',
      fallback: null,
      expected: 3,
    },
    {
      name: 'returns fallback for missing path',
      obj: { a: { b: {} } },
      path: 'a.b.c',
      fallback: 'missing',
      expected: 'missing',
    },
    {
      name: 'returns fallback when obj is null',
      obj: null,
      path: 'a.b',
      fallback: 'none',
      expected: 'none',
    },
  ])('safeGet $name', ({ obj, path, fallback, expected }) => {
    const result = safeGet(obj, path, fallback as any);

    expect(result).toBe(expected as any);
  });

  it('isClient returns true in happy-dom', () => {
    const result = isClient();

    expect(result).toBe(true);
  });

  it('clientOnly executes fn on client', () => {
    const result = clientOnly(() => 'ok');

    expect(result).toBe('ok');
  });

  it('validateDiscussionData returns null for null', () => {
    const result = validateDiscussionData(null);

    expect(result).toBeNull();
  });

  it('validateDiscussionData ensures arrays exist', () => {
    const result = validateDiscussionData({
      id: 'd1',
      DownloadableFiles: undefined,
      DiscussionChannels: null,
    });

    expect(result).toEqual({
      id: 'd1',
      DownloadableFiles: [],
      DiscussionChannels: [],
    });
  });

  it('validateEventData returns null for undefined', () => {
    const result = validateEventData(undefined);

    expect(result).toBeNull();
  });

  it('validateEventData ensures arrays exist', () => {
    const result = validateEventData({
      id: 'e1',
      EventChannels: undefined,
    });

    expect(result).toEqual({
      id: 'e1',
      EventChannels: [],
    });
  });
});
