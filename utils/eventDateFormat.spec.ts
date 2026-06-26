import { describe, it, expect } from 'vitest';
import { formatEventDateString } from './eventDateFormat';

describe('formatEventDateString', () => {
  it('includes a time component for a timed event', () => {
    expect(
      formatEventDateString({ startTime: '2024-06-15T14:30:00.000Z' })
    ).toMatch(/\d:\d{2}\s?(AM|PM)/i);
  });

  it('omits the time for a single all-day event', () => {
    expect(
      formatEventDateString({
        startTime: '2024-06-15T00:00:00.000Z',
        endTime: '2024-06-15T23:59:00.000Z',
        isAllDay: true,
      })
    ).not.toMatch(/:/);
  });

  it('shows a date range for a multi-day all-day event', () => {
    expect(
      formatEventDateString({
        startTime: '2024-06-15T00:00:00.000Z',
        endTime: '2024-06-17T00:00:00.000Z',
        isAllDay: true,
      })
    ).toContain(' - ');
  });
});
