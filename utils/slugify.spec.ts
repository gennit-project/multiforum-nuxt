import { describe, expect, it } from 'vitest';
import {
  buildSlugSegment,
  parseSlugSegmentNumber,
  slugify,
} from './slugify';

describe('slugify', () => {
  it.each([
    ['Trail conditions', 'trail-conditions'],
    ['  --Hello,   World!!  ', 'hello-world'],
    ['Café Münster', 'cafe-munster'],
    ['!!!', ''],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('slugifies %j to %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('caps length without leaving a trailing hyphen', () => {
    expect(slugify('alpha beta gamma', 11)).toBe('alpha-beta');
  });

  it('defaults to a 60 character cap', () => {
    expect(slugify('a'.repeat(100)).length).toBe(60);
  });
});

describe('buildSlugSegment', () => {
  it('joins the number and slug', () => {
    expect(buildSlugSegment({ id: 42, title: 'Trail conditions' })).toBe(
      '42-trail-conditions'
    );
  });

  it('is just the number when the title yields no slug', () => {
    expect(buildSlugSegment({ id: 42, title: '???' })).toBe('42');
  });

  it('is just the number when there is no title', () => {
    expect(buildSlugSegment({ id: 7 })).toBe('7');
  });
});

describe('parseSlugSegmentNumber', () => {
  it.each([
    ['42-trail-conditions', 42],
    ['42', 42],
    [' 7-x ', 7],
    ['trail-42', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('parses %j as %j', (segment, expected) => {
    expect(parseSlugSegmentNumber(segment)).toBe(expected);
  });

  it('reads the first entry of a repeated param', () => {
    expect(parseSlugSegmentNumber(['9-a', '10-b'])).toBe(9);
  });

  it('rejects integers beyond the safe range', () => {
    expect(parseSlugSegmentNumber('99999999999999999999-x')).toBeNull();
  });
});
