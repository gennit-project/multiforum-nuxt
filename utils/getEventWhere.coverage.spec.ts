import { describe, it, expect } from 'vitest';
import getEventWhere from '@/utils/getEventWhere';
import { LocationFilterTypes } from '@/components/event/list/filters/locationFilterTypes';
import { timeShortcutValues } from '@/components/event/list/filters/eventSearchOptions';
import type { SearchEventValues } from '@/types/Event';

// NOTE: The sibling getEventWhere.spec.ts uses a dynamic import + fake clock
// to assert exact timestamps. That import pattern means v8 coverage does not
// attribute those tests to getEventWhere.ts. This spec imports the module
// statically so its branches register as covered; it asserts the structural
// filter conditions (which are time-independent) and that each time shortcut
// produces a date range.

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

type BuildInput = {
  filterValues?: Partial<SearchEventValues>;
  showMap?: boolean;
  channelId?: string;
  onlineOnly?: boolean;
};

const build = ({
  filterValues = {},
  showMap = false,
  channelId = '',
  onlineOnly = false,
}: BuildInput = {}) =>
  getEventWhere({
    filterValues: { ...defaultFilterValues, ...filterValues },
    showMap,
    channelId,
    onlineOnly,
  });

// The AND array always ends with the two endTime range conditions.
const conditions = (where: ReturnType<typeof build>) =>
  (where.AND ?? []) as Array<Record<string, unknown>>;

const hasCondition = (
  where: ReturnType<typeof build>,
  match: Record<string, unknown>
) =>
  conditions(where).some((c) =>
    expect
      .objectContaining(match)
      .asymmetricMatch?.(c)
  );

describe('getEventWhere (structural coverage)', () => {
  describe('archived / channel scoping', () => {
    it('requires a non-archived channel in sitewide view', () => {
      const where = build();
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            EventChannels_SOME: expect.objectContaining({ archived: false }),
          }),
        ])
      );
    });

    it('drops the archived constraint when showArchived is set (sitewide)', () => {
      const where = build({ filterValues: { showArchived: true } });
      const channelCond = conditions(where).find((c) => 'EventChannels_SOME' in c);
      expect(channelCond?.EventChannels_SOME).not.toHaveProperty('archived');
    });

    it('scopes to a single channel (non-archived) when channelId is set', () => {
      const where = build({ channelId: 'cats' });
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            EventChannels_SOME: { channelUniqueName: 'cats', archived: false },
          }),
        ])
      );
    });

    it('includes archived channel events when showArchived is set with a channelId', () => {
      const where = build({ channelId: 'cats', filterValues: { showArchived: true } });
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            EventChannels_SOME: { channelUniqueName: 'cats' },
          }),
        ])
      );
    });

    it('matches selected channels in sitewide view', () => {
      const where = build({ filterValues: { channels: ['cats', ''] } });
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            EventChannels_SOME: expect.objectContaining({
              OR: [{ channelUniqueName_CONTAINS: 'cats', archived: false }],
            }),
          }),
        ])
      );
    });
  });

  describe('boolean filters', () => {
    it('adds a free filter when free is true', () => {
      expect(hasCondition(build({ filterValues: { free: true } }), { free: true })).toBe(true);
    });

    it('omits the free filter when free is false', () => {
      expect(conditions(build()).some((c) => 'free' in c)).toBe(false);
    });

    it('hides canceled events by default', () => {
      expect(hasCondition(build(), { canceled: false })).toBe(true);
    });

    it('shows canceled events when requested', () => {
      const where = build({ filterValues: { showCanceledEvents: true } });
      expect(conditions(where).some((c) => 'canceled' in c)).toBe(false);
    });

    it('filters for virtual events when hasVirtualEventUrl is set', () => {
      expect(
        hasCondition(build({ filterValues: { hasVirtualEventUrl: true } }), {
          NOT: { virtualEventUrl: null },
        })
      ).toBe(true);
    });

    it('filters for online events when onlineOnly is set', () => {
      expect(
        hasCondition(build({ onlineOnly: true }), { NOT: { virtualEventUrl: null } })
      ).toBe(true);
    });
  });

  describe('text search', () => {
    it('builds a case-insensitive title/description match', () => {
      const where = build({ filterValues: { searchInput: 'jazz' } });
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            OR: [
              { title_MATCHES: '(?i).*jazz.*' },
              { description_MATCHES: '(?i).*jazz.*' },
            ],
          }),
        ])
      );
    });
  });

  describe('location filters', () => {
    it('requires a location on the map for NONE + showMap', () => {
      expect(
        hasCondition(build({ showMap: true }), { NOT: { location: null } })
      ).toBe(true);
    });

    it('requires a location name for ONLY_WITH_ADDRESS', () => {
      expect(
        hasCondition(
          build({ filterValues: { locationFilter: LocationFilterTypes.ONLY_WITH_ADDRESS } }),
          { NOT: { locationName: null } }
        )
      ).toBe(true);
    });

    it('requires a physical location for ONLY_VIRTUAL on the map', () => {
      expect(
        hasCondition(
          build({
            showMap: true,
            filterValues: { locationFilter: LocationFilterTypes.ONLY_VIRTUAL },
          }),
          { location: null }
        )
      ).toBe(true);
    });

    it('builds a radius filter for WITHIN_RADIUS with coordinates', () => {
      const where = build({
        filterValues: {
          locationFilter: LocationFilterTypes.WITHIN_RADIUS,
          radius: 25,
          latitude: 33.4,
          longitude: -112,
        },
      });
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            location_LTE: expect.objectContaining({ distance: 25000 }),
          }),
        ])
      );
    });

    it('falls back to any-distance (locationName) for radius 0', () => {
      expect(
        hasCondition(
          build({
            filterValues: {
              locationFilter: LocationFilterTypes.WITHIN_RADIUS,
              radius: 0,
            },
          }),
          { NOT: { locationName: null } }
        )
      ).toBe(true);
    });
  });

  describe('tag filter', () => {
    it('matches any of the selected tags', () => {
      const where = build({ filterValues: { tags: ['music', 'art'] } });
      expect(where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Tags_SOME: {
              OR: [{ text_CONTAINS: 'music' }, { text_CONTAINS: 'art' }],
            },
          }),
        ])
      );
    });
  });

  describe('time shortcuts', () => {
    it.each(Object.values(timeShortcutValues))(
      'produces an endTime range for the "%s" shortcut',
      (timeShortcut) => {
        const where = build({ filterValues: { timeShortcut } });
        expect(conditions(where).some((c) => 'endTime_GT' in c)).toBe(true);
        expect(conditions(where).some((c) => 'endTime_LT' in c)).toBe(true);
      }
    );

    it('defaults to a now..+2y range for NONE', () => {
      const where = build();
      const gt = conditions(where).find((c) => 'endTime_GT' in c)?.endTime_GT as string;
      const lt = conditions(where).find((c) => 'endTime_LT' in c)?.endTime_LT as string;
      expect(new Date(lt).getTime() - new Date(gt).getTime()).toBeGreaterThan(
        // ~2 years in ms, minus a margin
        1.9 * 365 * 24 * 60 * 60 * 1000
      );
    });
  });
});
