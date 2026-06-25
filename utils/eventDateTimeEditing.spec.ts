import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  applyTimeToTimestamp,
  applyDateToTimestamp,
  computeStartDateChange,
  computeEndDateChange,
} from './eventDateTimeEditing';

// A fixed timestamp with a UTC offset so assertions are deterministic across
// the machine timezone: 2024-03-10 14:30 in UTC.
const BASE_ISO = '2024-03-10T14:30:00.000Z';

const localDay = (iso: string) =>
  DateTime.fromISO(iso).toFormat('yyyy-MM-dd');

const localTime = (iso: string) => DateTime.fromISO(iso).toFormat('HH:mm');

describe('applyTimeToTimestamp', () => {
  it('returns null when the time value is empty', () => {
    expect(applyTimeToTimestamp(BASE_ISO, '')).toBeNull();
  });

  it('returns null when the time value is not parseable', () => {
    expect(applyTimeToTimestamp(BASE_ISO, '99:99')).toBeNull();
  });

  it('replaces the time-of-day on the timestamp', () => {
    const result = applyTimeToTimestamp(BASE_ISO, '09:15');
    expect(localTime(result as string)).toBe('09:15');
  });

  it('preserves the calendar date when changing the time', () => {
    const result = applyTimeToTimestamp(BASE_ISO, '09:15');
    expect(localDay(result as string)).toBe(localDay(BASE_ISO));
  });
});

describe('applyDateToTimestamp', () => {
  it('returns null when the date value is empty', () => {
    expect(applyDateToTimestamp(BASE_ISO, '')).toBeNull();
  });

  it('returns null when the date value is invalid', () => {
    expect(applyDateToTimestamp(BASE_ISO, 'not-a-date')).toBeNull();
  });

  it('replaces the calendar date on the timestamp', () => {
    const result = applyDateToTimestamp(BASE_ISO, '2025-06-20');
    expect(localDay(result as string)).toBe('2025-06-20');
  });

  it('preserves the time-of-day when changing the date', () => {
    const result = applyDateToTimestamp(BASE_ISO, '2025-06-20');
    expect(localTime(result as string)).toBe(localTime(BASE_ISO));
  });
});

describe('computeStartDateChange', () => {
  const startISO = '2024-03-10T14:00:00.000Z';
  const endISO = '2024-03-10T16:00:00.000Z';

  it('returns null when the date value is invalid', () => {
    expect(
      computeStartDateChange({
        startISO,
        endISO,
        dateValue: '',
        isMultiDay: false,
      })
    ).toBeNull();
  });

  it('updates the start date', () => {
    const result = computeStartDateChange({
      startISO,
      endISO,
      dateValue: '2024-04-01',
      isMultiDay: false,
    });
    expect(localDay(result!.startTime)).toBe('2024-04-01');
  });

  it('moves the end date to match for single-day events', () => {
    const result = computeStartDateChange({
      startISO,
      endISO,
      dateValue: '2024-04-01',
      isMultiDay: false,
    });
    expect(localDay(result!.endTime as string)).toBe('2024-04-01');
  });

  it('leaves the end date untouched for multi-day events', () => {
    const result = computeStartDateChange({
      startISO,
      endISO,
      dateValue: '2024-04-01',
      isMultiDay: true,
    });
    expect(result!.endTime).toBeUndefined();
  });
});

describe('computeEndDateChange', () => {
  const startISO = '2024-03-10T14:00:00.000Z';
  const endISO = '2024-03-10T16:00:00.000Z';

  it('returns null when the date value is invalid', () => {
    expect(
      computeEndDateChange({ startISO, endISO, dateValue: 'nope' })
    ).toBeNull();
  });

  it('updates the end date', () => {
    const result = computeEndDateChange({
      startISO,
      endISO,
      dateValue: '2024-03-12',
    });
    expect(localDay(result!.endTime)).toBe('2024-03-12');
  });

  it('flags multi-day when the new end date differs from the start date', () => {
    const result = computeEndDateChange({
      startISO,
      endISO,
      dateValue: '2024-03-12',
    });
    expect(result!.isMultiDay).toBe(true);
  });

  it('is not multi-day when the end date matches the start date', () => {
    const result = computeEndDateChange({
      startISO,
      endISO,
      dateValue: '2024-03-10',
    });
    expect(result!.isMultiDay).toBe(false);
  });
});
