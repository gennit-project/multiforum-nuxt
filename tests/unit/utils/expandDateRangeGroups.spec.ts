import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  expandDateRangeGroups,
  validateDateRangeGroup,
} from '@/utils/expandDateRangeGroups';
import type { DateRangeGroup } from '@/types/Event';

describe('expandDateRangeGroups', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-10T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTZ;
  });

  it('expands a single-day range to one occurrence', () => {
    const groups: DateRangeGroup[] = [
      {
        startDate: '2024-12-12',
        endDate: '2024-12-12',
        startTimeOfDay: '09:00',
        endTimeOfDay: '17:00',
      },
    ];

    const result = expandDateRangeGroups(groups);

    expect(result).toHaveLength(1);
    expect(result[0]!.startTime).toContain('2024-12-12T09:00:00');
    expect(result[0]!.endTime).toContain('2024-12-12T17:00:00');
  });

  it('expands a multi-day range to multiple occurrences', () => {
    const groups: DateRangeGroup[] = [
      {
        startDate: '2024-12-12',
        endDate: '2024-12-14',
        startTimeOfDay: '09:00',
        endTimeOfDay: '17:00',
      },
    ];

    const result = expandDateRangeGroups(groups);

    expect(result).toHaveLength(3);
    expect(result[0]!.startTime).toContain('2024-12-12T09:00:00');
    expect(result[1]!.startTime).toContain('2024-12-13T09:00:00');
    expect(result[2]!.startTime).toContain('2024-12-14T09:00:00');
  });

  it('combines multiple groups into sorted occurrences', () => {
    const groups: DateRangeGroup[] = [
      {
        startDate: '2024-12-15',
        endDate: '2024-12-15',
        startTimeOfDay: '10:00',
        endTimeOfDay: '12:00',
      },
      {
        startDate: '2024-12-12',
        endDate: '2024-12-13',
        startTimeOfDay: '09:00',
        endTimeOfDay: '17:00',
      },
    ];

    const result = expandDateRangeGroups(groups);

    expect(result).toHaveLength(3);
    // Results should be sorted by date
    expect(result[0]!.startTime).toContain('2024-12-12');
    expect(result[1]!.startTime).toContain('2024-12-13');
    expect(result[2]!.startTime).toContain('2024-12-15');
  });

  it('handles empty groups array', () => {
    const result = expandDateRangeGroups([]);

    expect(result).toHaveLength(0);
  });
});

describe('validateDateRangeGroup', () => {
  it('returns valid for a correct single-day range', () => {
    const group: DateRangeGroup = {
      startDate: '2024-12-12',
      endDate: '2024-12-12',
      startTimeOfDay: '09:00',
      endTimeOfDay: '17:00',
    };

    const result = validateDateRangeGroup(group);

    expect(result.valid).toBe(true);
  });

  it('returns valid for a correct multi-day range', () => {
    const group: DateRangeGroup = {
      startDate: '2024-12-12',
      endDate: '2024-12-14',
      startTimeOfDay: '09:00',
      endTimeOfDay: '17:00',
    };

    const result = validateDateRangeGroup(group);

    expect(result.valid).toBe(true);
  });

  it('returns invalid when end date is before start date', () => {
    const group: DateRangeGroup = {
      startDate: '2024-12-15',
      endDate: '2024-12-12',
      startTimeOfDay: '09:00',
      endTimeOfDay: '17:00',
    };

    const result = validateDateRangeGroup(group);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('End date must be on or after start date');
  });

  it('returns invalid when end time is before start time', () => {
    const group: DateRangeGroup = {
      startDate: '2024-12-12',
      endDate: '2024-12-12',
      startTimeOfDay: '17:00',
      endTimeOfDay: '09:00',
    };

    const result = validateDateRangeGroup(group);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('End time must be after start time');
  });

  it('returns invalid when range exceeds 31 days', () => {
    const group: DateRangeGroup = {
      startDate: '2024-12-01',
      endDate: '2025-01-15',
      startTimeOfDay: '09:00',
      endTimeOfDay: '17:00',
    };

    const result = validateDateRangeGroup(group);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Date range cannot exceed 31 days');
  });
});
