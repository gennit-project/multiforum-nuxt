import { describe, it, expect } from 'vitest';
import type { DateRangeGroup } from '@/types/Event';
import {
  expandDateRangeGroups,
  validateDateRangeGroup,
} from './expandDateRangeGroups';

const group = (overrides: Partial<DateRangeGroup> = {}): DateRangeGroup =>
  ({
    startDate: '2024-12-12',
    endDate: '2024-12-14',
    startTimeOfDay: '09:00',
    endTimeOfDay: '17:00',
    ...overrides,
  }) as DateRangeGroup;

describe('expandDateRangeGroups', () => {
  it('produces one occurrence per day in the range', () => {
    expect(expandDateRangeGroups([group()])).toHaveLength(3);
  });

  it('skips groups with an invalid date', () => {
    expect(
      expandDateRangeGroups([group({ startDate: 'not-a-date' })])
    ).toEqual([]);
  });

  it('orders occurrences by start time', () => {
    const result = expandDateRangeGroups([group()]);
    expect(result[0].startTime < result[1].startTime).toBe(true);
  });
});

describe('validateDateRangeGroup', () => {
  it('accepts a well-formed group', () => {
    expect(validateDateRangeGroup(group()).valid).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    expect(
      validateDateRangeGroup(group({ endDate: '2024-12-10' })).error
    ).toBe('End date must be on or after start date');
  });

  it('rejects an end time that is not after the start time', () => {
    expect(
      validateDateRangeGroup(group({ startTimeOfDay: '17:00', endTimeOfDay: '09:00' }))
        .error
    ).toBe('End time must be after start time');
  });

  it('rejects a range longer than 31 days', () => {
    expect(
      validateDateRangeGroup(group({ startDate: '2024-01-01', endDate: '2024-03-01' }))
        .error
    ).toBe('Date range cannot exceed 31 days');
  });
});
