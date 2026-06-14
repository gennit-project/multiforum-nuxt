/**
 * Utility functions for sidebar event list display.
 * Used by SidebarEventList.vue to categorize events by timing.
 */

import { DateTime } from 'luxon';
import type { Event } from '@/__generated__/graphql';

/**
 * Check if an event is currently happening (started but not yet ended).
 */
export function isEventHappeningNow(event: Event, now?: DateTime): boolean {
  const currentTime = (now ?? DateTime.now()).toISO();
  if (!currentTime) return false;
  return event.startTime < currentTime && event.endTime > currentTime;
}

/**
 * Check if an event is happening today (starts today, hasn't started yet).
 */
export function isEventHappeningToday(event: Event, now?: DateTime): boolean {
  const startTime = DateTime.fromISO(event.startTime ?? '');
  const currentTime = now ?? DateTime.now();
  return (
    startTime.day === currentTime.day &&
    startTime.month === currentTime.month &&
    startTime.year === currentTime.year
  );
}

/**
 * Check if an event is happening tomorrow.
 */
export function isEventHappeningTomorrow(event: Event, now?: DateTime): boolean {
  const startTime = DateTime.fromISO(event.startTime ?? '');
  const currentTime = now ?? DateTime.now();
  const tomorrow = currentTime.startOf('day').plus({ days: 1 });
  return (
    startTime.day === tomorrow.day &&
    startTime.month === tomorrow.month &&
    startTime.year === tomorrow.year
  );
}

/**
 * Check if an event is after tomorrow.
 */
export function isEventAfterTomorrow(event: Event, now?: DateTime): boolean {
  const startTime = DateTime.fromISO(event.startTime ?? '');
  const currentTime = now ?? DateTime.now();
  // End of tomorrow (start of day after tomorrow)
  const dayAfterTomorrow = currentTime.startOf('day').plus({ days: 2 });
  return startTime >= dayAfterTomorrow;
}

/**
 * Get formatted date section header (e.g., "Thu Nov 9").
 */
export function getDateSectionFormat(date: string): string {
  const dateObj = DateTime.fromISO(date);
  return dateObj.toLocaleString({
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get sidebar link text for an event.
 * For all-day events: "All Day · Event Title"
 * For timed events: "10:00 AM · Event Title"
 */
export function getSidebarLinkText(event: Event): string {
  if (event.isAllDay) {
    return `All Day · ${event.title}`;
  }
  const startTime = DateTime.fromISO(event.startTime ?? '');
  return `${startTime.toLocaleString(DateTime.TIME_SIMPLE)} · ${event.title}`;
}

export type CategorizedEvents = {
  happeningNow: Event[];
  happeningToday: Event[];
  happeningTomorrow: Event[];
  afterTomorrow: Event[];
};

/**
 * Categorize events by their timing relative to now.
 */
export function categorizeEventsByTiming(events: Event[], now?: DateTime): CategorizedEvents {
  const result: CategorizedEvents = {
    happeningNow: [],
    happeningToday: [],
    happeningTomorrow: [],
    afterTomorrow: [],
  };

  for (const event of events) {
    if (!event) continue;

    if (isEventHappeningNow(event, now)) {
      result.happeningNow.push(event);
    } else if (isEventHappeningToday(event, now)) {
      result.happeningToday.push(event);
    } else if (isEventHappeningTomorrow(event, now)) {
      result.happeningTomorrow.push(event);
    } else if (isEventAfterTomorrow(event, now)) {
      result.afterTomorrow.push(event);
    }
  }

  return result;
}

/**
 * Group events by their date section (for events after tomorrow).
 */
export function groupEventsByDateSection(events: Event[]): Record<string, Event[]> {
  const result: Record<string, Event[]> = {};

  for (const event of events) {
    if (!event) continue;

    const date = getDateSectionFormat(event.startTime ?? '');
    if (!result[date]) {
      result[date] = [];
    }
    result[date].push(event);
  }

  return result;
}
