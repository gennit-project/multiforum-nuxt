import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateTime } from 'luxon';
import { LocationFilterTypes } from './locationFilterTypes';
import { timeShortcutValues } from './eventSearchOptions';
import type { EventWhere } from '@/__generated__/graphql';
import type { SearchEventValues } from '@/types/Event';

const TEST_NOW = new Date('2026-06-10T12:34:56.000Z');

type GetEventWhereInput = {
  filterValues?: SearchEventValues;
  showMap?: boolean;
  channelId?: string;
  onlineOnly?: boolean;
};

const defaultFilterValues: SearchEventValues = {
  timeShortcut: timeShortcutValues.NONE,
  tags: [],
  channels: [],
  searchInput: '',
  showCanceledEvents: false,
  free: false,
  locationFilter: LocationFilterTypes.NONE,
  hasVirtualEventUrl: false,
  showArchived: false,
};

const loadGetEventWhere = async () => {
  vi.useFakeTimers();
  vi.setSystemTime(TEST_NOW);
  vi.resetModules();

  const module = await import('./getEventWhere');
  return module.default;
};

const buildWhere = async ({
  filterValues,
  showMap = false,
  channelId = '',
  onlineOnly = false,
}: GetEventWhereInput = {}) => {
  const getEventWhere = await loadGetEventWhere();

  return getEventWhere({
    filterValues: {
      ...defaultFilterValues,
      ...filterValues,
    },
    showMap,
    channelId,
    onlineOnly,
  });
};

const findCondition = (
  where: EventWhere,
  predicate: (condition: EventWhere) => boolean
) => where.AND?.find(predicate);

afterEach(() => {
  vi.useRealTimers();
});

describe('getEventWhere', () => {
  it('requires a non-archived channel in sitewide view by default', async () => {
    const where = await buildWhere();

    expect(where.AND?.[0]).toEqual({
      EventChannels_SOME: {
        NOT: {
          channelUniqueName: null,
        },
        archived: false,
      },
    });
  });

  it('does not exclude archived channels when showArchived is true', async () => {
    const where = await buildWhere({
      filterValues: { showArchived: true },
    });

    expect(where.AND?.[0]).toEqual({
      EventChannels_SOME: {
        NOT: {
          channelUniqueName: null,
        },
      },
    });
  });

  it('uses channelId instead of selected channel filters in channel view', async () => {
    const where = await buildWhere({
      channelId: 'cats',
      filterValues: { channels: ['dogs'] },
    });

    expect(
      findCondition(
        where,
        (condition) =>
          condition.EventChannels_SOME?.channelUniqueName === 'cats'
      )
    ).toEqual({
      EventChannels_SOME: {
        channelUniqueName: 'cats',
        archived: false,
      },
    });
  });

  it('builds selected sitewide channel filters and removes empty channels', async () => {
    const where = await buildWhere({
      filterValues: { channels: ['cats', '', 'dogs'] },
    });

    expect(
      findCondition(where, (condition) =>
        Boolean(condition.EventChannels_SOME?.OR)
      )
    ).toEqual({
      EventChannels_SOME: {
        OR: [
          { channelUniqueName_CONTAINS: 'cats', archived: false },
          { channelUniqueName_CONTAINS: 'dogs', archived: false },
        ],
      },
    });
  });

  it('builds tag filters from selected tags', async () => {
    const where = await buildWhere({
      filterValues: { tags: ['music', 'art'] },
    });

    expect(
      findCondition(where, (condition) => Boolean(condition.Tags_SOME))
    ).toEqual({
      Tags_SOME: {
        OR: [{ text_CONTAINS: 'music' }, { text_CONTAINS: 'art' }],
      },
    });
  });

  it('builds title and description filters from search input', async () => {
    const where = await buildWhere({
      filterValues: { searchInput: 'jazz' },
    });

    expect(findCondition(where, (condition) => Boolean(condition.OR))).toEqual({
      OR: [
        { title_MATCHES: '(?i).*jazz.*' },
        { description_MATCHES: '(?i).*jazz.*' },
      ],
    });
  });

  it('builds distance filters in meters', async () => {
    const where = await buildWhere({
      filterValues: {
        locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        radius: 25,
        latitude: 33.4484,
        longitude: -112.074,
      },
    });

    expect(
      findCondition(where, (condition) => Boolean(condition.location_LTE))
    ).toEqual({
      location_LTE: {
        point: {
          latitude: 33.4484,
          longitude: -112.074,
        },
        distance: 25000,
      },
    });
  });

  it('requires a location when radius is zero', async () => {
    const where = await buildWhere({
      filterValues: {
        locationFilter: LocationFilterTypes.WITHIN_RADIUS,
        radius: 0,
      },
    });

    expect(
      findCondition(
        where,
        (condition) => condition.NOT?.locationName === null
      )
    ).toEqual({ NOT: { locationName: null } });
  });

  it('requires virtual event URLs for online-only lists', async () => {
    const where = await buildWhere({
      onlineOnly: true,
    });

    expect(
      findCondition(
        where,
        (condition) => condition.NOT?.virtualEventUrl === null
      )
    ).toEqual({ NOT: { virtualEventUrl: null } });
  });

  it('requires virtual event URLs when hasVirtualEventUrl is selected', async () => {
    const where = await buildWhere({
      filterValues: { hasVirtualEventUrl: true },
    });

    expect(
      findCondition(
        where,
        (condition) => condition.NOT?.virtualEventUrl === null
      )
    ).toEqual({ NOT: { virtualEventUrl: null } });
  });

  it('requires physical event locations for in-person filters', async () => {
    const where = await buildWhere({
      filterValues: { locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS },
    });

    expect(
      findCondition(
        where,
        (condition) => condition.NOT?.locationName === null
      )
    ).toEqual({ NOT: { locationName: null } });
  });

  it('requires mappable events when the map is shown without a location filter', async () => {
    const where = await buildWhere({
      showMap: true,
      filterValues: { locationFilter: LocationFilterTypes.NONE },
    });

    expect(
      findCondition(where, (condition) => condition.NOT?.location === null)
    ).toEqual({ NOT: { location: null } });
  });

  it('keeps only non-mappable virtual events when virtual filtering is used on the map', async () => {
    const where = await buildWhere({
      showMap: true,
      filterValues: { locationFilter: LocationFilterTypes.ONLY_VIRTUAL },
    });

    expect(
      findCondition(where, (condition) => condition.location === null)
    ).toEqual({ location: null });
  });

  it('adds a free event filter when free is selected', async () => {
    const where = await buildWhere({
      filterValues: { free: true },
    });

    expect(findCondition(where, (condition) => condition.free === true)).toEqual(
      { free: true }
    );
  });

  it('excludes canceled events by default', async () => {
    const where = await buildWhere();

    expect(
      findCondition(where, (condition) => condition.canceled === false)
    ).toEqual({ canceled: false });
  });

  it('does not add a canceled filter when showCanceledEvents is true', async () => {
    const where = await buildWhere({
      filterValues: { showCanceledEvents: true },
    });

    expect(
      where.AND?.some((condition) => condition.canceled === false)
    ).toBe(false);
  });

  const timeShortcutCases = [
    {
      name: 'uses today as the time range',
      timeShortcut: timeShortcutValues.TODAY,
      getExpectedRange: () => {
        const now = DateTime.now();
        return {
          start: now.startOf('day').toISO(),
          end: now.endOf('day').toISO(),
        };
      },
    },
    {
      name: 'uses tomorrow as the time range',
      timeShortcut: timeShortcutValues.TOMORROW,
      getExpectedRange: () => {
        const now = DateTime.now();
        return {
          start: now.startOf('day').plus({ days: 1 }).toISO(),
          end: now.endOf('day').plus({ days: 1 }).toISO(),
        };
      },
    },
    {
      name: 'uses this month as the time range',
      timeShortcut: timeShortcutValues.THIS_MONTH,
      getExpectedRange: () => {
        const startOfThisMonth = DateTime.now().startOf('month');
        return {
          start: startOfThisMonth.toISO(),
          end: startOfThisMonth.plus({ months: 1 }).toISO(),
        };
      },
    },
    {
      name: 'uses next month as the time range',
      timeShortcut: timeShortcutValues.NEXT_MONTH,
      getExpectedRange: () => {
        const startOfThisMonth = DateTime.now().startOf('month');
        return {
          start: startOfThisMonth.plus({ months: 1 }).toISO(),
          end: startOfThisMonth.plus({ months: 2 }).toISO(),
        };
      },
    },
    {
      name: 'uses past events as the time range',
      timeShortcut: timeShortcutValues.PAST_EVENTS,
      getExpectedRange: () => {
        const now = DateTime.now();
        return {
          start: now.minus({ years: 2 }).toISO(),
          end: now.startOf('day').toISO(),
        };
      },
    },
  ];

  for (const { name, timeShortcut, getExpectedRange } of timeShortcutCases) {
    it(name, async () => {
      const where = await buildWhere({
        filterValues: { timeShortcut },
      });
      const expectedRange = getExpectedRange();

      expect(where.AND?.slice(-2)).toEqual([
        { endTime_GT: expectedRange.start },
        { endTime_LT: expectedRange.end },
      ]);
    });
  }
});
