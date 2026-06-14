import type { EventSort } from '@/__generated__/graphql';

export type DateMode = 'single' | 'multiple' | 'recurring';

export interface DateOccurrence {
  startTime: string;
  endTime: string;
}

export interface DateRangeGroup {
  startDate: string; // "2024-12-12"
  endDate: string; // "2024-12-14"
  startTimeOfDay: string; // "09:00"
  endTimeOfDay: string; // "17:00"
}

export type RepeatPatternType = 'MANUAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RepeatEndType = 'NEVER' | 'AFTER_COUNT' | 'ON_DATE';

export interface RepeatPattern {
  type: RepeatPatternType;
  count?: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // [0, 6] for weekends (0 = Sunday)
  endType: RepeatEndType;
  endCount?: number; // Number of occurrences
  endDate?: string; // End date ISO string
}

export interface CreateEditEventFormValues {
  title: string;
  description: string;
  selectedTags: Array<string>;
  selectedChannels: Array<string>;
  address?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  isInPrivateResidence: boolean;
  virtualEventUrl?: string;
  startTime: string;
  startTimeDayOfWeek: string;
  startTimeHourOfDay: number;
  endTime: string;
  canceled: boolean;
  deleted: boolean;
  cost: string;
  free: boolean;
  isHostedByOP: boolean;
  isAllDay: boolean;
  coverImageURL?: string;
  eventType?: string;
  // Multi-date / recurring event fields
  dateMode: DateMode;
  occurrences: DateOccurrence[];
  dateRangeGroups: DateRangeGroup[];
  repeatPattern?: RepeatPattern;
}

export type WeekdayData = {
  number: string;
  name: string;
  shortName: string;
};

export type HourRangeData = {
  min: number;
  max: number;
  '12-hour-label': string;
  '24-hour-label': string;
};

export type SelectedWeekdays = {
  [index: string]: boolean;
};

export type SelectedHourRanges = {
  [index: string]: boolean;
};

export type SelectedHourRangeObject = {
  [index: string]: HourRangeData;
};

export type SelectedWeekdayObject = {
  [index: string]: string;
};

export type SelectedWeeklyHourRanges = {
  [index: string]: SelectedHourRanges;
};

export type DistanceUnit = {
  label: string;
  value: string | number;
};

export type SearchEventValues = {
  // With the exception of 'hourRanges' and 'weekdays',
  // these values are used to build the
  // EventWhere and ResultsOrder input parameters for the
  // GET_EVENTS GraphQL query.
  // They are also used in the URL query
  // parameters on the event search pages.
  // These must match because the URL query
  // parameters are used to build the EventWhere.
  timeShortcut?: string;
  radius?: number;
  placeName?: string;
  placeAddress?: string;
  latitude?: number;
  longitude?: number;
  tags?: Array<string>;
  channels?: Array<string>;
  locationFilter?: string;
  searchInput?: string;
  showCanceledEvents?: boolean;
  free?: boolean;
  resultsOrder?: EventSort;
  hasVirtualEventUrl?: boolean;
  showArchived?: boolean;
};
