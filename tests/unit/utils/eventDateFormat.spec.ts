import { describe, it, expect } from 'vitest';
import { formatEventDateString } from '@/utils/eventDateFormat';

// Naive ISO strings (no zone) parse and format in the same local zone, so the
// time portion is stable across environments.

describe('formatEventDateString', () => {
  it('includes the time for a timed event', () => {
    const result = formatEventDateString({
      startTime: '2024-06-01T18:30:00',
    });
    expect(result).toContain('6:30 PM');
  });

  it('includes the weekday and date for a timed event', () => {
    const result = formatEventDateString({
      startTime: '2024-06-01T18:30:00',
    });
    expect(result).toContain('Saturday June 1 2024');
  });

  it('omits the time for an all-day single-day event', () => {
    const result = formatEventDateString({
      startTime: '2024-06-01T00:00:00',
      isAllDay: true,
      endTime: '2024-06-01T23:00:00',
    });
    expect(result).toBe('Saturday June 1 2024');
  });

  it('shows a date range for a multi-day all-day event', () => {
    const result = formatEventDateString({
      startTime: '2024-06-01T00:00:00',
      isAllDay: true,
      endTime: '2024-06-03T00:00:00',
    });
    expect(result).toBe('Saturday June 1 2024 - Monday June 3 2024');
  });

  it('falls back to the timed format when all-day has no end time', () => {
    const result = formatEventDateString({
      startTime: '2024-06-01T18:30:00',
      isAllDay: true,
    });
    expect(result).toContain('6:30 PM');
  });
});
