import { DateTime } from 'luxon';
import type { DateRangeGroup, DateOccurrence } from '@/types/Event';

/**
 * Expands grouped date ranges into individual date occurrences.
 *
 * Example:
 * Input: [{ startDate: "2024-12-12", endDate: "2024-12-14", startTimeOfDay: "09:00", endTimeOfDay: "17:00" }]
 * Output: [
 *   { startTime: "2024-12-12T09:00:00", endTime: "2024-12-12T17:00:00" },
 *   { startTime: "2024-12-13T09:00:00", endTime: "2024-12-13T17:00:00" },
 *   { startTime: "2024-12-14T09:00:00", endTime: "2024-12-14T17:00:00" }
 * ]
 */
export function expandDateRangeGroups(
  groups: DateRangeGroup[]
): DateOccurrence[] {
  const occurrences: DateOccurrence[] = [];

  for (const group of groups) {
    const startDate = DateTime.fromISO(group.startDate);
    const endDate = DateTime.fromISO(group.endDate);

    if (!startDate.isValid || !endDate.isValid) {
      console.warn('Invalid date range group:', group);
      continue;
    }

    // Parse start and end times
    const [startHour, startMinute] = group.startTimeOfDay.split(':').map(Number);
    const [endHour, endMinute] = group.endTimeOfDay.split(':').map(Number);

    // Generate an occurrence for each day in the range
    let currentDate = startDate;
    while (currentDate <= endDate) {
      const occurrenceStart = currentDate.set({
        hour: startHour,
        minute: startMinute,
        second: 0,
        millisecond: 0,
      });

      const occurrenceEnd = currentDate.set({
        hour: endHour,
        minute: endMinute,
        second: 0,
        millisecond: 0,
      });

      occurrences.push({
        startTime: occurrenceStart.toISO() || '',
        endTime: occurrenceEnd.toISO() || '',
      });

      currentDate = currentDate.plus({ days: 1 });
    }
  }

  // Sort occurrences by start time
  occurrences.sort((a, b) => {
    const dateA = DateTime.fromISO(a.startTime);
    const dateB = DateTime.fromISO(b.startTime);
    return dateA.toMillis() - dateB.toMillis();
  });

  return occurrences;
}

/**
 * Validates a date range group
 */
export function validateDateRangeGroup(group: DateRangeGroup): {
  valid: boolean;
  error?: string;
} {
  const startDate = DateTime.fromISO(group.startDate);
  const endDate = DateTime.fromISO(group.endDate);

  if (!startDate.isValid) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (!endDate.isValid) {
    return { valid: false, error: 'Invalid end date' };
  }

  if (endDate < startDate) {
    return { valid: false, error: 'End date must be on or after start date' };
  }

  // Parse times
  const startTimeParts = group.startTimeOfDay.split(':');
  const endTimeParts = group.endTimeOfDay.split(':');

  if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
    return { valid: false, error: 'Invalid time format' };
  }

  const startHour = startTimeParts[0] ?? '0';
  const startMin = startTimeParts[1] ?? '0';
  const endHour = endTimeParts[0] ?? '0';
  const endMin = endTimeParts[1] ?? '0';

  const startMinutes = parseInt(startHour, 10) * 60 + parseInt(startMin, 10);
  const endMinutes = parseInt(endHour, 10) * 60 + parseInt(endMin, 10);

  if (endMinutes <= startMinutes) {
    return { valid: false, error: 'End time must be after start time' };
  }

  // Limit range to 31 days to prevent performance issues
  const dayCount = Math.floor(endDate.diff(startDate, 'days').days) + 1;
  if (dayCount > 31) {
    return {
      valid: false,
      error: 'Date range cannot exceed 31 days',
    };
  }

  return { valid: true };
}

export default expandDateRangeGroups;
