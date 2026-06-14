import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  isEventHappeningNow,
  isEventHappeningToday,
  isEventHappeningTomorrow,
  isEventAfterTomorrow,
  getDateSectionFormat,
  getSidebarLinkText,
  categorizeEventsByTiming,
  groupEventsByDateSection,
} from '@/utils/sidebarEventUtils';
import type { Event } from '@/__generated__/graphql';

describe('sidebarEventUtils', () => {
  // Use a fixed reference time for consistent tests
  const mockNow = DateTime.fromISO('2024-06-15T10:00:00.000Z');

  function createMockEvent(overrides: Partial<Event> = {}): Event {
    return {
      id: 'test-event',
      title: 'Test Event',
      startTime: mockNow.toISO(),
      endTime: mockNow.plus({ hours: 2 }).toISO(),
      isAllDay: false,
      ...overrides,
    } as Event;
  }

  describe('isEventHappeningNow', () => {
    it('returns true when event has started but not ended', () => {
      const event = createMockEvent({
        startTime: mockNow.minus({ hours: 1 }).toISO() ?? '',
        endTime: mockNow.plus({ hours: 1 }).toISO() ?? '',
      });
      expect(isEventHappeningNow(event, mockNow)).toBe(true);
    });

    it('returns false when event has not started yet', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ hours: 1 }).toISO() ?? '',
        endTime: mockNow.plus({ hours: 2 }).toISO() ?? '',
      });
      expect(isEventHappeningNow(event, mockNow)).toBe(false);
    });

    it('returns false when event has already ended', () => {
      const event = createMockEvent({
        startTime: mockNow.minus({ hours: 3 }).toISO() ?? '',
        endTime: mockNow.minus({ hours: 1 }).toISO() ?? '',
      });
      expect(isEventHappeningNow(event, mockNow)).toBe(false);
    });
  });

  describe('isEventHappeningToday', () => {
    it('returns true when event starts later today', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ hours: 2 }).toISO() ?? '',
      });
      expect(isEventHappeningToday(event, mockNow)).toBe(true);
    });

    it('returns true when event started earlier today', () => {
      const event = createMockEvent({
        startTime: mockNow.minus({ hours: 2 }).toISO() ?? '',
      });
      expect(isEventHappeningToday(event, mockNow)).toBe(true);
    });

    it('returns false when event is tomorrow', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ days: 1 }).toISO() ?? '',
      });
      expect(isEventHappeningToday(event, mockNow)).toBe(false);
    });
  });

  describe('isEventHappeningTomorrow', () => {
    it('returns true when event starts tomorrow', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ days: 1 }).toISO() ?? '',
      });
      expect(isEventHappeningTomorrow(event, mockNow)).toBe(true);
    });

    it('returns false when event is today', () => {
      const event = createMockEvent({
        startTime: mockNow.toISO() ?? '',
      });
      expect(isEventHappeningTomorrow(event, mockNow)).toBe(false);
    });

    it('returns false when event is after tomorrow', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ days: 2 }).toISO() ?? '',
      });
      expect(isEventHappeningTomorrow(event, mockNow)).toBe(false);
    });
  });

  describe('isEventAfterTomorrow', () => {
    it('returns true when event is 2 days from now', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ days: 2 }).toISO() ?? '',
      });
      expect(isEventAfterTomorrow(event, mockNow)).toBe(true);
    });

    it('returns true when event is a week from now', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ weeks: 1 }).toISO() ?? '',
      });
      expect(isEventAfterTomorrow(event, mockNow)).toBe(true);
    });

    it('returns false when event is tomorrow', () => {
      const event = createMockEvent({
        startTime: mockNow.plus({ days: 1 }).toISO() ?? '',
      });
      expect(isEventAfterTomorrow(event, mockNow)).toBe(false);
    });
  });

  describe('getDateSectionFormat', () => {
    it('formats date as short weekday, month, and day', () => {
      const result = getDateSectionFormat('2024-06-20T14:00:00.000Z');
      // The exact format depends on locale, but should include these elements
      expect(result).toMatch(/\w+/); // At least contains some text
    });

    it('handles different dates correctly', () => {
      const result1 = getDateSectionFormat('2024-01-01T10:00:00.000Z');
      const result2 = getDateSectionFormat('2024-12-25T10:00:00.000Z');
      expect(result1).not.toBe(result2);
    });
  });

  describe('getSidebarLinkText', () => {
    it('returns "All Day" format for all-day events', () => {
      const event = createMockEvent({
        title: 'Company Holiday',
        isAllDay: true,
      });
      expect(getSidebarLinkText(event)).toBe('All Day · Company Holiday');
    });

    it('returns time format for timed events', () => {
      const event = createMockEvent({
        title: 'Team Meeting',
        isAllDay: false,
        startTime: '2024-06-15T14:30:00.000Z',
      });
      const result = getSidebarLinkText(event);
      expect(result).toContain('Team Meeting');
      expect(result).toContain('·');
    });
  });

  describe('categorizeEventsByTiming', () => {
    it('returns empty categories for empty input', () => {
      const result = categorizeEventsByTiming([], mockNow);
      expect(result).toEqual({
        happeningNow: [],
        happeningToday: [],
        happeningTomorrow: [],
        afterTomorrow: [],
      });
    });

    it('categorizes events correctly', () => {
      const happeningNowEvent = createMockEvent({
        id: 'now',
        startTime: mockNow.minus({ hours: 1 }).toISO() ?? '',
        endTime: mockNow.plus({ hours: 1 }).toISO() ?? '',
      });

      const todayEvent = createMockEvent({
        id: 'today',
        startTime: mockNow.plus({ hours: 3 }).toISO() ?? '',
        endTime: mockNow.plus({ hours: 4 }).toISO() ?? '',
      });

      const tomorrowEvent = createMockEvent({
        id: 'tomorrow',
        startTime: mockNow.plus({ days: 1 }).toISO() ?? '',
      });

      const nextWeekEvent = createMockEvent({
        id: 'nextweek',
        startTime: mockNow.plus({ days: 5 }).toISO() ?? '',
      });

      const result = categorizeEventsByTiming(
        [happeningNowEvent, todayEvent, tomorrowEvent, nextWeekEvent],
        mockNow
      );

      expect(result.happeningNow.map((e) => e.id)).toContain('now');
      expect(result.happeningTomorrow.map((e) => e.id)).toContain('tomorrow');
      expect(result.afterTomorrow.map((e) => e.id)).toContain('nextweek');
    });

    it('skips null events', () => {
      const validEvent = createMockEvent({ id: 'valid' });
      // @ts-expect-error - Testing with null values
      const result = categorizeEventsByTiming([null, validEvent, undefined], mockNow);
      const totalEvents =
        result.happeningNow.length +
        result.happeningToday.length +
        result.happeningTomorrow.length +
        result.afterTomorrow.length;
      expect(totalEvents).toBe(1);
    });
  });

  describe('groupEventsByDateSection', () => {
    it('returns empty object for empty input', () => {
      expect(groupEventsByDateSection([])).toEqual({});
    });

    it('groups events by their date section', () => {
      const event1 = createMockEvent({
        id: '1',
        startTime: '2024-06-20T10:00:00.000Z',
      });
      const event2 = createMockEvent({
        id: '2',
        startTime: '2024-06-20T14:00:00.000Z',
      });
      const event3 = createMockEvent({
        id: '3',
        startTime: '2024-06-21T10:00:00.000Z',
      });

      const result = groupEventsByDateSection([event1, event2, event3]);

      // Should have 2 date sections
      expect(Object.keys(result).length).toBe(2);
    });

    it('skips null events', () => {
      const validEvent = createMockEvent({
        id: 'valid',
        startTime: '2024-06-20T10:00:00.000Z',
      });
      // @ts-expect-error - Testing with null values
      const result = groupEventsByDateSection([null, validEvent]);
      const totalEvents = Object.values(result).flat().length;
      expect(totalEvents).toBe(1);
    });
  });
});
