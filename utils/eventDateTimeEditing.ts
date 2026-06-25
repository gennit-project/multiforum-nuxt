import { DateTime } from 'luxon';

/**
 * Pure date/time helpers backing the start/end pickers in the event form.
 *
 * Each picker only edits one axis of a timestamp at a time: the time picker
 * changes the time-of-day while keeping the date, and the date picker changes
 * the calendar date while keeping the time-of-day. These functions take the
 * existing ISO timestamp plus the new partial value and return the recomputed
 * ISO string (or null when the input is empty/invalid), keeping the tricky
 * Luxon math out of the component and unit-testable.
 */

/**
 * Replace the time-of-day (`HH:mm`) on an existing ISO timestamp while
 * preserving its calendar date and zone.
 *
 * @returns the new ISO string, or null when the time value is empty/invalid.
 */
export function applyTimeToTimestamp(
  currentISO: string,
  timeValue: string
): string | null {
  if (!timeValue) return null;

  const current = DateTime.fromJSDate(new Date(currentISO));
  const updated = DateTime.fromFormat(timeValue, 'HH:mm', {
    zone: current.zone,
  }).set({
    year: current.year,
    month: current.month,
    day: current.day,
  });

  return updated.isValid ? updated.toISO() : null;
}

/**
 * Replace the calendar date (year/month/day) on an existing ISO timestamp
 * while preserving its time-of-day and zone.
 *
 * @returns the new ISO string, or null when the date value is empty/invalid.
 */
export function applyDateToTimestamp(
  currentISO: string,
  dateValue: string
): string | null {
  if (!dateValue) return null;

  const inputDateTime = DateTime.fromISO(dateValue);
  if (!inputDateTime.isValid) return null;

  const updated = DateTime.fromJSDate(new Date(currentISO)).set({
    year: inputDateTime.year,
    month: inputDateTime.month,
    day: inputDateTime.day,
  });

  return updated.isValid ? updated.toISO() : null;
}

export type StartDateChangeInput = {
  startISO: string;
  endISO: string;
  dateValue: string;
  /** When false (single-day event) the end date is moved to match the start. */
  isMultiDay: boolean;
};

/**
 * Compute the form updates when the start-date picker changes. For single-day
 * events the end date follows the start date so the event stays on one day.
 *
 * @returns the fields to emit, or null when the date value is empty/invalid.
 */
export function computeStartDateChange({
  startISO,
  endISO,
  dateValue,
  isMultiDay,
}: StartDateChangeInput): { startTime: string; endTime?: string } | null {
  const startTime = applyDateToTimestamp(startISO, dateValue);
  if (!startTime) return null;

  const updates: { startTime: string; endTime?: string } = { startTime };

  if (!isMultiDay) {
    const endTime = applyDateToTimestamp(endISO, dateValue);
    if (endTime) updates.endTime = endTime;
  }

  return updates;
}

export type EndDateChangeInput = {
  startISO: string;
  endISO: string;
  dateValue: string;
};

/**
 * Compute the form update when the end-date picker changes, along with whether
 * the event now spans more than one calendar day.
 *
 * @returns the new end time and multi-day flag, or null when the date value is
 *   empty/invalid.
 */
export function computeEndDateChange({
  startISO,
  endISO,
  dateValue,
}: EndDateChangeInput): { endTime: string; isMultiDay: boolean } | null {
  const endTime = applyDateToTimestamp(endISO, dateValue);
  if (!endTime) return null;

  const startDateTime = DateTime.fromJSDate(new Date(startISO));
  const endDateTime = DateTime.fromISO(endTime);
  const isMultiDay = !startDateTime.hasSame(endDateTime, 'day');

  return { endTime, isMultiDay };
}
