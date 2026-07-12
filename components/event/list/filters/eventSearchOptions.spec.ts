import { describe, expect, it } from 'vitest';

import {
  LocationFilterTypes,
} from './locationFilterTypes';
import {
  createDefaultSelectedHourRanges,
  createDefaultSelectedWeekdays,
  createDefaultSelectedWeeklyHourRanges,
  defaultSelectedHourRanges,
  defaultSelectedWeekdays,
  defaultSelectedWeeklyHourRanges,
  distanceOptionsForKilometers,
  distanceOptionsForMiles,
  distanceUnitOptions,
  eventFilterTypeShortcuts,
  hourRangesObject,
  MilesOrKm,
  resultOrderTypes,
  timeFilterShortcuts,
  timeShortcutValues,
  weekdayMap,
} from './eventSearchOptions';

describe('eventSearchOptions', () => {
  it('builds fresh default weekday and hour-range objects with all values false', () => {
    const weekdays = createDefaultSelectedWeekdays();
    const hourRanges = createDefaultSelectedHourRanges();

    expect(Object.values(weekdays)).toEqual(
      expect.arrayContaining([false])
    );
    expect(Object.values(hourRanges)).toEqual(
      expect.arrayContaining([false])
    );
    expect(defaultSelectedWeekdays).toEqual(weekdays);
    expect(defaultSelectedHourRanges).toEqual(hourRanges);
    expect(weekdays).not.toBe(defaultSelectedWeekdays);
    expect(hourRanges).not.toBe(defaultSelectedHourRanges);
  });

  it('builds fresh weekly hour ranges without sharing weekday objects', () => {
    const weeklyRanges = createDefaultSelectedWeeklyHourRanges();

    expect(defaultSelectedWeeklyHourRanges).toEqual(weeklyRanges);
    expect(weeklyRanges).not.toBe(defaultSelectedWeeklyHourRanges);
    expect(weeklyRanges['1']).not.toBe(weeklyRanges['2']);
    expect(Object.values(weeklyRanges['1'] || {})).toEqual(
      expect.arrayContaining([false])
    );
  });

  it('maps shortcut and location filter labels to the expected values', () => {
    expect(timeFilterShortcuts.map((shortcut) => shortcut.value)).toEqual([
      timeShortcutValues.TODAY,
      timeShortcutValues.TOMORROW,
      timeShortcutValues.THIS_WEEKEND,
      timeShortcutValues.NEXT_WEEK,
      timeShortcutValues.NEXT_WEEKEND,
      timeShortcutValues.THIS_MONTH,
      timeShortcutValues.NEXT_MONTH,
      timeShortcutValues.PAST_EVENTS,
    ]);

    expect(eventFilterTypeShortcuts).toEqual([
      {
        label: 'Online events',
        locationFilterType: LocationFilterTypes.ONLY_VIRTUAL,
      },
      {
        label: 'In-person events',
        locationFilterType: LocationFilterTypes.ONLY_WITH_ADDRESS,
      },
    ]);
  });

  it('exposes weekday and hour-range lookup objects for query building', () => {
    expect(weekdayMap['0']).toBe('Sunday');
    expect(weekdayMap['6']).toBe('Saturday');
    expect(hourRangesObject['12am-3am']).toEqual(
      expect.objectContaining({ min: 0, max: 3 })
    );
    expect(hourRangesObject['9pm-12am']).toEqual(
      expect.objectContaining({ min: 21, max: 24 })
    );
  });

  it('keeps distance options and ordering constants aligned with search UI expectations', () => {
    expect(distanceOptionsForMiles[0]).toEqual({ label: '5', value: 8.04672 });
    expect(distanceOptionsForMiles.at(-1)).toEqual({
      label: 'Any distance',
      value: 0,
    });
    expect(distanceOptionsForKilometers.at(-1)).toEqual({
      label: 'Any distance',
      value: 0,
    });
    expect(distanceUnitOptions).toEqual([
      { label: 'km', value: MilesOrKm.KM },
      { label: 'mi', value: MilesOrKm.MI },
    ]);
    expect(resultOrderTypes).toEqual({
      CHRONOLOGICAL: 'CHRONOLOGICAL',
      REVERSE_CHRONOLOGICAL: 'REVERSE_CHRONOLOGICAL',
    });
  });
});
