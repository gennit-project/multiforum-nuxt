import { DateTime } from 'luxon';

/**
 * Formats an event's date for display, extracted from EventHeader. All-day
 * events show date(s) without a time; multi-day all-day events show a range;
 * timed events include the start time. Pure, so it can be unit-tested.
 */
export type FormatEventDateParams = {
  startTime: string;
  isAllDay?: boolean | null;
  endTime?: string | null;
};

const DATE_FORMAT = 'cccc LLLL d yyyy';
const DATE_TIME_FORMAT = 'cccc LLLL d yyyy h:mm a';

export function formatEventDateString(params: FormatEventDateParams): string {
  const { startTime, isAllDay, endTime } = params;

  if (isAllDay && endTime) {
    const start = DateTime.fromISO(startTime);
    const end = DateTime.fromISO(endTime);
    if (start.hasSame(end, 'day')) {
      return start.toFormat(DATE_FORMAT);
    }
    return `${start.toFormat(DATE_FORMAT)} - ${end.toFormat(DATE_FORMAT)}`;
  }

  return DateTime.fromISO(startTime).toFormat(DATE_TIME_FORMAT);
}
