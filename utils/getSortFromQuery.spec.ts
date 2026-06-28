import { describe, it, expect } from 'vitest';
import { SortType, TimeFrame } from '@/__generated__/graphql';
import {
  capitalizeCase,
  getSortFromQuery,
  getTimeFrameFromQuery,
} from './getSortFromQuery';

// A valid non-default sort/timeframe value to distinguish from the fallback.
const otherSort = Object.values(SortType).find((s) => s !== SortType.Hot)!;
const otherTimeFrame = Object.values(TimeFrame).find(
  (t) => t !== TimeFrame.Month
)!;

describe('capitalizeCase', () => {
  it('capitalizes the first letter and lowercases the rest', () => {
    expect(capitalizeCase('hELLO')).toBe('Hello');
  });
});

describe('getSortFromQuery', () => {
  it('returns the valid sort from the query', () => {
    expect(getSortFromQuery({ sort: otherSort })).toBe(otherSort);
  });

  it('is case-insensitive', () => {
    expect(getSortFromQuery({ sort: String(otherSort).toUpperCase() })).toBe(
      otherSort
    );
  });

  it('defaults to Hot when the sort is missing', () => {
    expect(getSortFromQuery({})).toBe(SortType.Hot);
  });

  it('defaults to Hot for an unrecognized sort', () => {
    expect(getSortFromQuery({ sort: 'nonsense' })).toBe(SortType.Hot);
  });

  it('defaults to Hot when sort is not a string', () => {
    expect(getSortFromQuery({ sort: ['a', 'b'] })).toBe(SortType.Hot);
  });
});

describe('getTimeFrameFromQuery', () => {
  it('returns the valid time frame from the query', () => {
    expect(getTimeFrameFromQuery({ timeFrame: otherTimeFrame })).toBe(
      otherTimeFrame
    );
  });

  it('defaults to Month when the time frame is missing', () => {
    expect(getTimeFrameFromQuery({})).toBe(TimeFrame.Month);
  });

  it('defaults to Month for an unrecognized time frame', () => {
    expect(getTimeFrameFromQuery({ timeFrame: 'nonsense' })).toBe(
      TimeFrame.Month
    );
  });
});
