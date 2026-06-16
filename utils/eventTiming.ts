import { DateTime } from 'luxon';

/**
 * Pure event date-status helpers, extracted from EventDetail. `now` is
 * injectable so the logic can be unit-tested deterministically.
 */
export type EventTimes = {
  startTime?: string | null;
  endTime?: string | null;
};

export function isEventInThePast(
  event: EventTimes | null | undefined,
  now: DateTime = DateTime.now()
): boolean {
  if (!event?.endTime) return false;
  return DateTime.fromISO(event.endTime) < now;
}

export function hasEventStarted(
  event: EventTimes | null | undefined,
  now: DateTime = DateTime.now()
): boolean {
  if (!event?.startTime) return false;
  return (
    DateTime.fromISO(event.startTime) < now && !isEventInThePast(event, now)
  );
}
