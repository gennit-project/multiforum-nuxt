import { describe, it, expect } from 'vitest';
import {
  toggleArrayItem,
  cleanQueryParams,
  buildInfowindowContent,
} from '@/utils/eventMap';

describe('toggleArrayItem', () => {
  it('adds an item that is not present', () => {
    expect(toggleArrayItem(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an item that is present', () => {
    expect(toggleArrayItem(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('adds to an empty array', () => {
    expect(toggleArrayItem([], 'a')).toEqual(['a']);
  });

  it('does not mutate the input array', () => {
    const input = ['a'];
    toggleArrayItem(input, 'b');

    expect(input).toEqual(['a']);
  });
});

describe('cleanQueryParams', () => {
  it('keeps truthy values', () => {
    expect(cleanQueryParams({ a: 'x', b: 'y' })).toEqual({ a: 'x', b: 'y' });
  });

  it('drops empty strings', () => {
    expect(cleanQueryParams({ a: 'x', b: '' })).toEqual({ a: 'x' });
  });

  it('drops null and undefined', () => {
    expect(cleanQueryParams({ a: 'x', b: null, c: undefined })).toEqual({ a: 'x' });
  });

  it('returns an empty object for all-falsy params', () => {
    expect(cleanQueryParams({ a: '', b: 0 })).toEqual({});
  });
});

describe('buildInfowindowContent', () => {
  it('returns just the title when there is no location', () => {
    expect(buildInfowindowContent('Cat Meetup')).toBe('<b>Cat Meetup</b>');
  });

  it('includes the location name when present', () => {
    expect(buildInfowindowContent('Cat Meetup', 'Downtown')).toContain(
      'at Downtown'
    );
  });

  it('marks the located variant with the infowindow test id', () => {
    expect(buildInfowindowContent('Cat Meetup', 'Downtown')).toContain(
      'data-testid="infowindow"'
    );
  });
});
