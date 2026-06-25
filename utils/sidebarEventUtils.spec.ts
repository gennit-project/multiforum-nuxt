import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import type { Event } from '@/__generated__/graphql';
import {
  isEventHappeningNow,
  isEventHappeningToday,
  isEventHappeningTomorrow,
  isEventAfterTomorrow,
  getDateSectionFormat,
  getSidebarLinkText,
  categorizeEventsByTiming,
  groupEventsByDateSection,
} from './sidebarEventUtils';

const NOW = DateTime.fromISO('2024-06-15T12:00:00.000Z', { zone: 'utc' });

const ev = (startTime: string, endTime: string, extra: Partial<Event> = {}): Event =>
  ({ startTime, endTime, title: 'E', ...extra } as Event);

describe('isEventHappeningNow', () => {
  it('is true when now falls between start and end', () => {
    expect(
      isEventHappeningNow(
        ev('2024-06-15T11:00:00.000Z', '2024-06-15T13:00:00.000Z'),
        NOW
      )
    ).toBe(true);
  });

  it('is false for an event that already ended', () => {
    expect(
      isEventHappeningNow(
        ev('2024-06-15T08:00:00.000Z', '2024-06-15T09:00:00.000Z'),
        NOW
      )
    ).toBe(false);
  });
});

describe('isEventHappeningToday', () => {
  it('is true for an event starting on the same calendar day', () => {
    expect(
      isEventHappeningToday(ev('2024-06-15T20:00:00.000Z', '2024-06-15T21:00:00.000Z'), NOW)
    ).toBe(true);
  });
});

describe('isEventHappeningTomorrow', () => {
  it('is true for an event starting the next day', () => {
    expect(
      isEventHappeningTomorrow(
        ev('2024-06-16T10:00:00.000Z', '2024-06-16T11:00:00.000Z'),
        NOW
      )
    ).toBe(true);
  });
});

describe('isEventAfterTomorrow', () => {
  it('is true for an event two or more days out', () => {
    expect(
      isEventAfterTomorrow(
        ev('2024-06-18T10:00:00.000Z', '2024-06-18T11:00:00.000Z'),
        NOW
      )
    ).toBe(true);
  });
});

describe('getDateSectionFormat', () => {
  it('formats an ISO date as a weekday-month-day header', () => {
    expect(getDateSectionFormat('2024-06-15T12:00:00.000Z')).toMatch(/Jun 15/);
  });
});

describe('getSidebarLinkText', () => {
  it('prefixes all-day events with "All Day"', () => {
    expect(
      getSidebarLinkText(ev('2024-06-15T00:00:00.000Z', '2024-06-15T23:59:00.000Z', {
        isAllDay: true,
        title: 'Festival',
      }))
    ).toBe('All Day · Festival');
  });
});

describe('categorizeEventsByTiming', () => {
  it('buckets an in-progress event under happeningNow', () => {
    const result = categorizeEventsByTiming(
      [ev('2024-06-15T11:00:00.000Z', '2024-06-15T13:00:00.000Z')],
      NOW
    );
    expect(result.happeningNow).toHaveLength(1);
  });
});

describe('groupEventsByDateSection', () => {
  it('groups events under their date-section header', () => {
    const grouped = groupEventsByDateSection([
      ev('2024-06-18T10:00:00.000Z', '2024-06-18T11:00:00.000Z'),
      ev('2024-06-18T14:00:00.000Z', '2024-06-18T15:00:00.000Z'),
    ]);
    expect(Object.values(grouped)[0]).toHaveLength(2);
  });
});
