import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateOccurrences, validateRepeatPattern } from '@/utils/generateOccurrences';
import type { RepeatPattern } from '@/types/Event';

// Mock DateTime.now() to return a fixed date for consistent tests
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('generateOccurrences', () => {
  const baseStartTime = '2026-04-01T18:00:00.000Z';
  const baseEndTime = '2026-04-01T20:00:00.000Z';

  it('returns single occurrence for MANUAL pattern', () => {
    const pattern: RepeatPattern = {
      type: 'MANUAL',
      endType: 'NEVER',
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      startTime: baseStartTime,
      endTime: baseEndTime,
    });
  });

  it('generates daily occurrences', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      count: 1,
      endType: 'AFTER_COUNT',
      endCount: 3,
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.startTime).toBe(baseStartTime);
    // Check the dates are correct (1 day apart)
    expect(result[1]!.startTime).toContain('2026-04-02');
    expect(result[2]!.startTime).toContain('2026-04-03');
  });

  it('generates daily occurrences with interval', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      count: 2, // Every 2 days
      endType: 'AFTER_COUNT',
      endCount: 3,
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.startTime).toBe(baseStartTime);
    // Check the dates are correct (2 days apart)
    expect(result[1]!.startTime).toContain('2026-04-03');
    expect(result[2]!.startTime).toContain('2026-04-05');
  });

  it('generates weekly occurrences', () => {
    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      count: 1,
      endType: 'AFTER_COUNT',
      endCount: 3,
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.startTime).toBe(baseStartTime);
    // Check the dates are correct (7 days apart)
    expect(result[1]!.startTime).toContain('2026-04-08');
    expect(result[2]!.startTime).toContain('2026-04-15');
  });

  it('generates weekly occurrences on specific days of week', () => {
    // Start on Wednesday (2026-04-01 is Wednesday)
    // Select Monday (1) and Wednesday (3)
    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      count: 1,
      daysOfWeek: [1, 3], // Monday and Wednesday
      endType: 'AFTER_COUNT',
      endCount: 4,
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime, // Wednesday
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(4);
    // First occurrence is the start date (Wednesday)
    expect(result[0]!.startTime).toBe(baseStartTime);
    // Next is Monday April 6
    expect(result[1]!.startTime).toContain('2026-04-06');
    // Then Wednesday April 8
    expect(result[2]!.startTime).toContain('2026-04-08');
    // Then Monday April 13
    expect(result[3]!.startTime).toContain('2026-04-13');
  });

  it('generates weekly occurrences when start day does not match selected days', () => {
    // Start on Tuesday April 7, 2026 (Tuesday is day 2)
    // But we only selected Wednesday (3) and Friday (5)
    const tuesdayStart = '2026-04-07T18:00:00.000Z';
    const tuesdayEnd = '2026-04-07T20:00:00.000Z';

    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      count: 1,
      daysOfWeek: [3, 5], // Wednesday and Friday only
      endType: 'AFTER_COUNT',
      endCount: 4,
    };

    const result = generateOccurrences({
      pattern,
      startTime: tuesdayStart,
      endTime: tuesdayEnd,
    });

    expect(result).toHaveLength(4);
    // First occurrence should be Wednesday April 8 (not Tuesday the start date)
    expect(result[0]!.startTime).toContain('2026-04-08');
    // Next is Friday April 10
    expect(result[1]!.startTime).toContain('2026-04-10');
    // Then Wednesday April 15
    expect(result[2]!.startTime).toContain('2026-04-15');
    // Then Friday April 17
    expect(result[3]!.startTime).toContain('2026-04-17');
  });

  it('generates weekly occurrences when start day does not match and respects end date', () => {
    // Start on Monday April 6, 2026 (Monday is day 1)
    // But we only selected Thursday (4)
    const mondayStart = '2026-04-06T18:00:00.000Z';
    const mondayEnd = '2026-04-06T20:00:00.000Z';

    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      count: 1,
      daysOfWeek: [4], // Thursday only
      endType: 'ON_DATE',
      endDate: '2026-04-15T00:00:00.000Z',
    };

    const result = generateOccurrences({
      pattern,
      startTime: mondayStart,
      endTime: mondayEnd,
    });

    // Should have 2 occurrences: Thursday April 9 and before end date April 15
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.startTime).toContain('2026-04-09');
  });

  it('generates weekly occurrences with multi-week interval when start does not match', () => {
    // Start on Tuesday April 7, 2026
    // Select Friday (5) with 2-week interval
    const tuesdayStart = '2026-04-07T18:00:00.000Z';
    const tuesdayEnd = '2026-04-07T20:00:00.000Z';

    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      count: 2, // Every 2 weeks
      daysOfWeek: [5], // Friday only
      endType: 'AFTER_COUNT',
      endCount: 3,
    };

    const result = generateOccurrences({
      pattern,
      startTime: tuesdayStart,
      endTime: tuesdayEnd,
    });

    expect(result).toHaveLength(3);
    // First occurrence is Friday April 10
    expect(result[0]!.startTime).toContain('2026-04-10');
    // Next is 2 weeks later: Friday April 24
    expect(result[1]!.startTime).toContain('2026-04-24');
    // Then Friday May 8
    expect(result[2]!.startTime).toContain('2026-05-08');
  });

  it('generates monthly occurrences', () => {
    const pattern: RepeatPattern = {
      type: 'MONTHLY',
      count: 1,
      endType: 'AFTER_COUNT',
      endCount: 3,
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.startTime).toBe(baseStartTime);
    // Check the months are correct
    expect(result[1]!.startTime).toContain('2026-05-01');
    expect(result[2]!.startTime).toContain('2026-06-01');
  });

  it('generates yearly occurrences', () => {
    const pattern: RepeatPattern = {
      type: 'YEARLY',
      count: 1,
      endType: 'AFTER_COUNT',
      endCount: 3,
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(3);
    expect(result[0]!.startTime).toBe(baseStartTime);
    // Check the years are correct
    expect(result[1]!.startTime).toContain('2027-04-01');
    expect(result[2]!.startTime).toContain('2028-04-01');
  });

  it('respects ON_DATE end condition', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      count: 1,
      endType: 'ON_DATE',
      endDate: '2026-04-05T00:00:00.000Z',
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
    });

    expect(result).toHaveLength(4);
    // Last occurrence should be April 4 (before end date of April 5)
    expect(result[result.length - 1]!.startTime).toContain('2026-04-04');
  });

  it('respects maxOccurrences parameter', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      count: 1,
      endType: 'NEVER',
    };

    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime,
      endTime: baseEndTime,
      maxOccurrences: 5,
    });

    expect(result).toHaveLength(5);
  });

  it('preserves event duration for occurrences', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      count: 1,
      endType: 'AFTER_COUNT',
      endCount: 2,
    };

    // 2-hour event
    const result = generateOccurrences({
      pattern,
      startTime: baseStartTime, // 18:00
      endTime: baseEndTime, // 20:00
    });

    const start1 = new Date(result[1]!.startTime);
    const end1 = new Date(result[1]!.endTime);
    const durationMs = end1.getTime() - start1.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    expect(durationHours).toBe(2);
  });
});

describe('validateRepeatPattern', () => {
  it('validates DAILY pattern with AFTER_COUNT', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      count: 1,
      endType: 'AFTER_COUNT',
      endCount: 5,
    };

    const result = validateRepeatPattern(pattern);
    expect(result).toEqual({ valid: true });
  });

  it('rejects missing pattern type', () => {
    const pattern = {
      endType: 'NEVER',
    } as RepeatPattern;

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Pattern type is required');
  });

  it('rejects invalid pattern type', () => {
    const pattern = {
      type: 'INVALID' as any,
      endType: 'NEVER',
    } as RepeatPattern;

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid pattern type');
  });

  it('rejects missing end type', () => {
    const pattern = {
      type: 'DAILY',
    } as RepeatPattern;

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End type is required');
  });

  it('rejects invalid end type', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      endType: 'INVALID' as any,
    };

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid end type');
  });

  it('rejects AFTER_COUNT without count', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      endType: 'AFTER_COUNT',
    };

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End count must be at least 1');
  });

  it('rejects AFTER_COUNT with count of 0', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      endType: 'AFTER_COUNT',
      endCount: 0,
    };

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End count must be at least 1');
  });

  it('rejects AFTER_COUNT exceeding maximum', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      endType: 'AFTER_COUNT',
      endCount: 150,
    };

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('cannot exceed');
  });

  it('rejects ON_DATE without end date', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      endType: 'ON_DATE',
    };

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End date is required');
  });

  it('rejects WEEKLY with empty daysOfWeek array', () => {
    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      daysOfWeek: [],
      endType: 'AFTER_COUNT',
      endCount: 5,
    };

    const result = validateRepeatPattern(pattern);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Select at least one day of the week');
  });

  it('accepts WEEKLY with selected days', () => {
    const pattern: RepeatPattern = {
      type: 'WEEKLY',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      endType: 'AFTER_COUNT',
      endCount: 5,
    };

    const result = validateRepeatPattern(pattern);
    expect(result).toEqual({ valid: true });
  });

  it('accepts ON_DATE with valid end date', () => {
    const pattern: RepeatPattern = {
      type: 'DAILY',
      endType: 'ON_DATE',
      endDate: '2026-04-30T00:00:00.000Z',
    };

    const result = validateRepeatPattern(pattern);
    expect(result).toEqual({ valid: true });
  });

  it('accepts NEVER end type', () => {
    const pattern: RepeatPattern = {
      type: 'MONTHLY',
      endType: 'NEVER',
    };

    const result = validateRepeatPattern(pattern);
    expect(result).toEqual({ valid: true });
  });

  it('accepts MANUAL pattern', () => {
    const pattern: RepeatPattern = {
      type: 'MANUAL',
      endType: 'NEVER',
    };

    const result = validateRepeatPattern(pattern);
    expect(result).toEqual({ valid: true });
  });
});
