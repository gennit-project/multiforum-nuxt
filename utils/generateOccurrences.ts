import { DateTime } from 'luxon';
import type {
  RepeatPattern,
  DateOccurrence,
} from '@/types/Event';

export interface GenerateOccurrencesInput {
  pattern: RepeatPattern;
  startTime: string;
  endTime: string;
  maxOccurrences?: number;
}

const DEFAULT_MAX_OCCURRENCES = 100;
const MAX_FUTURE_DAYS = 365;

/**
 * Get the next occurrence date based on the pattern
 */
function getNextDate(current: DateTime, pattern: RepeatPattern): DateTime {
  const interval = pattern.count || 1;

  switch (pattern.type) {
    case 'DAILY':
      return current.plus({ days: interval });
    case 'WEEKLY':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        return getNextWeeklyOccurrence(current, pattern.daysOfWeek, interval);
      }
      return current.plus({ weeks: interval });
    case 'MONTHLY':
      return current.plus({ months: interval });
    case 'YEARLY':
      return current.plus({ years: interval });
    default:
      return current.plus({ days: 1 });
  }
}

/**
 * Get next weekly occurrence for specific days of week
 */
function getNextWeeklyOccurrence(
  current: DateTime,
  daysOfWeek: number[],
  weekInterval: number
): DateTime {
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

  // Convert Luxon weekday to our format (0 = Sunday)
  // Luxon uses 1-7 (Mon-Sun), we use 0-6 (Sun-Sat)
  const ourCurrentDay = current.weekday % 7;

  // Find next day in current week
  for (const day of sortedDays) {
    if (day > ourCurrentDay) {
      return current.plus({ days: day - ourCurrentDay });
    }
  }

  // Go to first day of next occurrence
  const firstDay = sortedDays[0] ?? 0;
  const daysUntilNextWeek = 7 - ourCurrentDay + firstDay;
  const daysToAdd = daysUntilNextWeek + (weekInterval - 1) * 7;
  return current.plus({ days: daysToAdd });
}

/**
 * Check if we're past the end condition
 */
function isPastEndCondition(
  date: DateTime,
  pattern: RepeatPattern,
  count: number,
  maxDate: DateTime
): boolean {
  if (pattern.endType === 'AFTER_COUNT') {
    return pattern.endCount ? count >= pattern.endCount : false;
  }

  if (pattern.endType === 'ON_DATE' && pattern.endDate) {
    const endDate = DateTime.fromISO(pattern.endDate);
    return date > endDate;
  }

  return date > maxDate;
}

/**
 * Generate occurrences from a repeat pattern
 */
export function generateOccurrences(
  input: GenerateOccurrencesInput
): DateOccurrence[] {
  const {
    pattern,
    startTime,
    endTime,
    maxOccurrences = DEFAULT_MAX_OCCURRENCES,
  } = input;

  if (pattern.type === 'MANUAL') {
    return [{ startTime, endTime }];
  }

  const occurrences: DateOccurrence[] = [];
  const startDt = DateTime.fromISO(startTime);
  const endDt = DateTime.fromISO(endTime);
  const duration = endDt.diff(startDt);
  const maxDate = DateTime.now().plus({ days: MAX_FUTURE_DAYS });

  // Handle weekly patterns with specific days
  if (
    pattern.type === 'WEEKLY' &&
    pattern.daysOfWeek &&
    pattern.daysOfWeek.length > 0
  ) {
    const startDay = startDt.weekday % 7;
    if (!pattern.daysOfWeek.includes(startDay)) {
      // Start doesn't match selected days - find first valid day
      let currentDt = getNextWeeklyOccurrence(
        startDt.minus({ days: 1 }),
        pattern.daysOfWeek,
        1
      );

      if (currentDt <= startDt) {
        currentDt = getNextWeeklyOccurrence(
          currentDt,
          pattern.daysOfWeek,
          pattern.count || 1
        );
      }

      const occStart = currentDt.set({
        hour: startDt.hour,
        minute: startDt.minute,
        second: startDt.second,
      });
      const occEnd = occStart.plus(duration);

      if (!isPastEndCondition(occStart, pattern, occurrences.length, maxDate)) {
        occurrences.push({
          startTime: occStart.toISO() || '',
          endTime: occEnd.toISO() || '',
        });
      }

      while (occurrences.length < maxOccurrences) {
        currentDt = getNextDate(currentDt, pattern);
        const nextStart = currentDt.set({
          hour: startDt.hour,
          minute: startDt.minute,
          second: startDt.second,
        });

        if (isPastEndCondition(nextStart, pattern, occurrences.length, maxDate)) {
          break;
        }

        const nextEnd = nextStart.plus(duration);
        occurrences.push({
          startTime: nextStart.toISO() || '',
          endTime: nextEnd.toISO() || '',
        });
      }

      return occurrences;
    }
  }

  // Add first occurrence
  occurrences.push({ startTime, endTime });

  // Generate subsequent occurrences
  let currentDt = startDt;

  while (occurrences.length < maxOccurrences) {
    currentDt = getNextDate(currentDt, pattern);
    const nextStart = currentDt.set({
      hour: startDt.hour,
      minute: startDt.minute,
      second: startDt.second,
    });

    if (isPastEndCondition(nextStart, pattern, occurrences.length, maxDate)) {
      break;
    }

    const nextEnd = nextStart.plus(duration);
    occurrences.push({
      startTime: nextStart.toISO() || '',
      endTime: nextEnd.toISO() || '',
    });
  }

  return occurrences;
}

/**
 * Validate a repeat pattern
 */
export function validateRepeatPattern(pattern: RepeatPattern): {
  valid: boolean;
  error?: string;
} {
  if (!pattern.type) {
    return { valid: false, error: 'Pattern type is required' };
  }

  if (!['MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(pattern.type)) {
    return { valid: false, error: 'Invalid pattern type' };
  }

  if (!pattern.endType) {
    return { valid: false, error: 'End type is required' };
  }

  if (!['NEVER', 'AFTER_COUNT', 'ON_DATE'].includes(pattern.endType)) {
    return { valid: false, error: 'Invalid end type' };
  }

  if (pattern.endType === 'AFTER_COUNT') {
    if (!pattern.endCount || pattern.endCount < 1) {
      return { valid: false, error: 'End count must be at least 1' };
    }
    if (pattern.endCount > DEFAULT_MAX_OCCURRENCES) {
      return { valid: false, error: `End count cannot exceed ${DEFAULT_MAX_OCCURRENCES}` };
    }
  }

  if (pattern.endType === 'ON_DATE' && !pattern.endDate) {
    return { valid: false, error: 'End date is required' };
  }

  if (
    pattern.type === 'WEEKLY' &&
    pattern.daysOfWeek &&
    pattern.daysOfWeek.length === 0
  ) {
    return { valid: false, error: 'Select at least one day of the week' };
  }

  return { valid: true };
}
