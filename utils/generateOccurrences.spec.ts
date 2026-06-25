import { describe, it, expect } from 'vitest';
import type { RepeatPattern } from '@/types/Event';
import {
  generateOccurrences,
  validateRepeatPattern,
} from './generateOccurrences';

const START = '2024-01-01T10:00:00.000Z';
const END = '2024-01-01T11:00:00.000Z';

describe('generateOccurrences', () => {
  it('returns a single occurrence for a MANUAL pattern', () => {
    expect(
      generateOccurrences({
        pattern: { type: 'MANUAL' } as RepeatPattern,
        startTime: START,
        endTime: END,
      })
    ).toEqual([{ startTime: START, endTime: END }]);
  });

  it('generates exactly endCount daily occurrences for AFTER_COUNT', () => {
    expect(
      generateOccurrences({
        pattern: {
          type: 'DAILY',
          count: 1,
          endType: 'AFTER_COUNT',
          endCount: 3,
        } as RepeatPattern,
        startTime: START,
        endTime: END,
      })
    ).toHaveLength(3);
  });

  it('starts the series at the provided start time', () => {
    expect(
      generateOccurrences({
        pattern: {
          type: 'DAILY',
          count: 1,
          endType: 'AFTER_COUNT',
          endCount: 2,
        } as RepeatPattern,
        startTime: START,
        endTime: END,
      })[0].startTime
    ).toBe(START);
  });
});

describe('validateRepeatPattern', () => {
  it('rejects a pattern with no type', () => {
    expect(validateRepeatPattern({} as RepeatPattern).valid).toBe(false);
  });

  it('rejects an invalid pattern type', () => {
    expect(
      validateRepeatPattern({ type: 'HOURLY' } as unknown as RepeatPattern).error
    ).toBe('Invalid pattern type');
  });

  it('requires an end count of at least 1 for AFTER_COUNT', () => {
    expect(
      validateRepeatPattern({
        type: 'DAILY',
        endType: 'AFTER_COUNT',
        endCount: 0,
      } as RepeatPattern).error
    ).toBe('End count must be at least 1');
  });

  it('requires an end date for ON_DATE', () => {
    expect(
      validateRepeatPattern({
        type: 'DAILY',
        endType: 'ON_DATE',
      } as RepeatPattern).error
    ).toBe('End date is required');
  });

  it('accepts a well-formed pattern', () => {
    expect(
      validateRepeatPattern({
        type: 'WEEKLY',
        endType: 'NEVER',
        daysOfWeek: [1, 3],
      } as RepeatPattern).valid
    ).toBe(true);
  });
});
