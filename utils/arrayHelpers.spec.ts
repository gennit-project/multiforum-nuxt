import { describe, it, expect } from 'vitest';
import { toggleInArray } from './arrayHelpers';

describe('toggleInArray', () => {
  it('appends a value that is not present', () => {
    expect(toggleInArray(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a value that is already present', () => {
    expect(toggleInArray(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('only removes the first matching item position via filter result', () => {
    expect(toggleInArray(['a', 'b', 'a'], 'a')).toEqual(['b', 'a']);
  });
});
