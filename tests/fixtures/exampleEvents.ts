import type { DateMode, DateOccurrence, RepeatPattern } from '@/types/Event';

/**
 * Realistic example events for the event-series tests, modeled on real venues
 * (all Phoenix-area, hence the Arizona `-07:00` offset). Years are normalized
 * to a fixed future year so the fixtures stay deterministic regardless of when
 * the suite runs.
 *
 * Sources:
 *  - Desert Botanical Garden, "Las Noches de las Luminarias" — single evening.
 *  - Heard Museum, "Lumenous" — Dec 16–18, 6–9pm (three nights).
 *  - SVM Foundation holiday market — Dec 14–15, 9am–4pm.
 *  - Downtown Chandler Farmers Market — Saturdays 9am–1pm (seasonal Oct–May;
 *    modeled as a plain weekly Saturday recurrence — the full seasonal range
 *    and "expo hours" style schedules are tracked in gennit-project/multiforum-nuxt#232).
 */

export type ExampleEvent = {
  title: string;
  dateMode: DateMode;
  /** Present for single + recurring (the anchor occurrence). */
  startTime?: string;
  endTime?: string;
  /** Present for "multiple" — the manually entered dates. */
  occurrences?: DateOccurrence[];
  /** Present for "recurring". */
  repeatPattern?: RepeatPattern;
};

// Single evening event.
export const LAS_NOCHES_AT_DBG: ExampleEvent = {
  title: 'Las Noches de las Luminarias',
  dateMode: 'single',
  startTime: '2030-11-29T17:30:00.000-07:00',
  endTime: '2030-11-29T21:30:00.000-07:00',
};

// Multi-night run entered as explicit dates (same hours each night).
export const LUMENOUS_AT_HEARD: ExampleEvent = {
  title: 'Lumenous at the Heard Museum',
  dateMode: 'multiple',
  occurrences: [
    { startTime: '2030-12-16T18:00:00.000-07:00', endTime: '2030-12-16T21:00:00.000-07:00' },
    { startTime: '2030-12-17T18:00:00.000-07:00', endTime: '2030-12-17T21:00:00.000-07:00' },
    { startTime: '2030-12-18T18:00:00.000-07:00', endTime: '2030-12-18T21:00:00.000-07:00' },
  ],
};

// Two-day market entered as explicit dates.
export const SVM_HOLIDAY_MARKET: ExampleEvent = {
  title: 'SVM Foundation Holiday Market',
  dateMode: 'multiple',
  occurrences: [
    { startTime: '2030-12-14T09:00:00.000-07:00', endTime: '2030-12-14T16:00:00.000-07:00' },
    { startTime: '2030-12-15T09:00:00.000-07:00', endTime: '2030-12-15T16:00:00.000-07:00' },
  ],
};

// Weekly recurring market (Saturdays 9am–1pm), capped at a season's worth.
export const DOWNTOWN_FARMERS_MARKET: ExampleEvent = {
  title: 'Downtown Chandler Farmers Market',
  dateMode: 'recurring',
  startTime: '2030-10-05T09:00:00.000-07:00', // first Saturday
  endTime: '2030-10-05T13:00:00.000-07:00',
  repeatPattern: {
    type: 'WEEKLY',
    count: 1,
    daysOfWeek: [6], // Saturday (0 = Sunday … 6 = Saturday)
    endType: 'AFTER_COUNT',
    endCount: 8,
  },
};
