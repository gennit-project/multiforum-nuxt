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
} from './ssrSafetyUtils';

describe('safeArrayFirst', () => {
  it('returns the first item of a non-empty array', () => {
    expect(safeArrayFirst([1, 2, 3])).toBe(1);
  });

  it('returns the fallback for an empty array', () => {
    expect(safeArrayFirst([], 'x')).toBe('x');
  });

  it('returns null for undefined input', () => {
    expect(safeArrayFirst(undefined)).toBeNull();
  });
});

describe('safeArrayLength', () => {
  it('returns the length of an array', () => {
    expect(safeArrayLength([1, 2])).toBe(2);
  });

  it('returns the fallback for non-array input', () => {
    expect(safeArrayLength(null, 5)).toBe(5);
  });
});

describe('ensureArray', () => {
  it('passes an array through', () => {
    expect(ensureArray([1])).toEqual([1]);
  });

  it('returns an empty array for nullish input', () => {
    expect(ensureArray(null)).toEqual([]);
  });
});

describe('safeGet', () => {
  it('reads a nested path', () => {
    expect(safeGet({ a: { b: { c: 5 } } }, 'a.b.c')).toBe(5);
  });

  it('returns the fallback for a missing path', () => {
    expect(safeGet({ a: {} }, 'a.b.c', 'none')).toBe('none');
  });
});

describe('isClient', () => {
  it('returns true under the happy-dom test environment', () => {
    expect(isClient()).toBe(true);
  });
});

describe('clientOnly', () => {
  it('runs the function on the client', () => {
    expect(clientOnly(() => 42)).toBe(42);
  });
});

describe('validateDiscussionData', () => {
  it('returns null for nullish input', () => {
    expect(validateDiscussionData(null)).toBeNull();
  });

  it('guarantees array properties exist', () => {
    expect(validateDiscussionData({ id: 'd1' })).toMatchObject({
      DownloadableFiles: [],
      DiscussionChannels: [],
    });
  });
});

describe('validateEventData', () => {
  it('guarantees EventChannels exists', () => {
    expect(validateEventData({ id: 'e1' })?.EventChannels).toEqual([]);
  });
});
