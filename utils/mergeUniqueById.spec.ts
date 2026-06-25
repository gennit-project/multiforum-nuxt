import { describe, it, expect } from 'vitest';
import { mergeUniqueById } from './mergeUniqueById';

describe('mergeUniqueById', () => {
  it('appends new items onto the existing list', () => {
    expect(
      mergeUniqueById([{ id: 'a' }], [{ id: 'b' }, { id: 'c' }])
    ).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });

  it('skips items whose id is already present', () => {
    expect(mergeUniqueById([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }])).toEqual([
      { id: 'a' },
      { id: 'b' },
    ]);
  });

  it('dedupes ids within the incoming batch', () => {
    expect(
      mergeUniqueById([], [{ id: 'a' }, { id: 'a' }, { id: 'b' }])
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('ignores falsy incoming entries', () => {
    expect(
      mergeUniqueById([], [null, { id: 'a' }, undefined])
    ).toEqual([{ id: 'a' }]);
  });

  it('returns the existing list unchanged when incoming is null', () => {
    expect(mergeUniqueById([{ id: 'a' }], null)).toEqual([{ id: 'a' }]);
  });

  it('preserves existing-then-new ordering', () => {
    expect(
      mergeUniqueById([{ id: 'b' }], [{ id: 'a' }]).map((i) => i.id)
    ).toEqual(['b', 'a']);
  });
});
