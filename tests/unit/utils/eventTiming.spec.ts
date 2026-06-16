import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { isEventInThePast, hasEventStarted } from '@/utils/eventTiming';

const NOW = DateTime.fromISO('2024-06-15T12:00:00.000Z');

describe('isEventInThePast', () => {
  it('is true when the end time is before now', () => {
    expect(isEventInThePast({ endTime: '2024-01-01T00:00:00Z' }, NOW)).toBe(
      true
    );
  });

  it('is false when the end time is in the future', () => {
    expect(isEventInThePast({ endTime: '2024-12-01T00:00:00Z' }, NOW)).toBe(
      false
    );
  });

  it('is false when there is no event', () => {
    expect(isEventInThePast(null, NOW)).toBe(false);
  });

  it('is false when there is no end time', () => {
    expect(isEventInThePast({ startTime: '2024-01-01T00:00:00Z' }, NOW)).toBe(
      false
    );
  });
});

describe('hasEventStarted', () => {
  it('is true when the event has started but not ended', () => {
    expect(
      hasEventStarted(
        { startTime: '2024-06-01T00:00:00Z', endTime: '2024-12-01T00:00:00Z' },
        NOW
      )
    ).toBe(true);
  });

  it('is false when the event has not started yet', () => {
    expect(
      hasEventStarted(
        { startTime: '2024-07-01T00:00:00Z', endTime: '2024-08-01T00:00:00Z' },
        NOW
      )
    ).toBe(false);
  });

  it('is false when the event is already over', () => {
    expect(
      hasEventStarted(
        { startTime: '2024-01-01T00:00:00Z', endTime: '2024-02-01T00:00:00Z' },
        NOW
      )
    ).toBe(false);
  });
});
