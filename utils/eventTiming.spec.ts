import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { isEventInThePast, hasEventStarted } from './eventTiming';

const NOW = DateTime.fromISO('2024-06-15T12:00:00.000Z', { zone: 'utc' });

describe('isEventInThePast', () => {
  it('is true when the end time is before now', () => {
    expect(
      isEventInThePast({ endTime: '2024-06-15T11:00:00.000Z' }, NOW)
    ).toBe(true);
  });

  it('is false when the end time is in the future', () => {
    expect(
      isEventInThePast({ endTime: '2024-06-15T13:00:00.000Z' }, NOW)
    ).toBe(false);
  });

  it('is false when there is no end time', () => {
    expect(isEventInThePast({}, NOW)).toBe(false);
  });
});

describe('hasEventStarted', () => {
  it('is true for an in-progress event', () => {
    expect(
      hasEventStarted(
        { startTime: '2024-06-15T11:00:00.000Z', endTime: '2024-06-15T13:00:00.000Z' },
        NOW
      )
    ).toBe(true);
  });

  it('is false for an event that already ended', () => {
    expect(
      hasEventStarted(
        { startTime: '2024-06-15T08:00:00.000Z', endTime: '2024-06-15T09:00:00.000Z' },
        NOW
      )
    ).toBe(false);
  });

  it('is false for an event that has not started', () => {
    expect(
      hasEventStarted({ startTime: '2024-06-15T13:00:00.000Z' }, NOW)
    ).toBe(false);
  });
});
