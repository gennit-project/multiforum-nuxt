import { describe, it, expect } from 'vitest';
import type { Event } from '@/__generated__/graphql';
import {
  buildEventLocationId,
  groupEventsByLocation,
  buildMarkerTitle,
  buildMarkerHoverContent,
  buildClusterColor,
  calculateClusterZoom,
} from '@/utils/mapMarkerLogic';

const event = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'e1',
    title: 'Cat Meetup',
    location: { latitude: 33.4, longitude: -111.9 },
    ...overrides,
  }) as unknown as Event;

describe('buildEventLocationId', () => {
  it('combines latitude and longitude', () => {
    expect(buildEventLocationId(event())).toBe('33.4-111.9');
  });

  it('returns null when there is no location', () => {
    expect(buildEventLocationId(event({ location: null }))).toBeNull();
  });
});

describe('groupEventsByLocation', () => {
  it('creates one group per distinct location', () => {
    const result = groupEventsByLocation([
      event({ id: 'a', location: { latitude: 1, longitude: 2 } }),
      event({ id: 'b', location: { latitude: 3, longitude: 4 } }),
    ]);

    expect(Object.keys(result)).toHaveLength(2);
  });

  it('groups events at the same location', () => {
    const result = groupEventsByLocation([
      event({ id: 'a', location: { latitude: 1, longitude: 2 } }),
      event({ id: 'b', location: { latitude: 1, longitude: 2 } }),
    ]);

    expect(result['12'].numberOfEvents).toBe(2);
  });

  it('keeps every event at a shared location keyed by id', () => {
    const result = groupEventsByLocation([
      event({ id: 'a', location: { latitude: 1, longitude: 2 } }),
      event({ id: 'b', location: { latitude: 1, longitude: 2 } }),
    ]);

    expect(Object.keys(result['12'].events)).toEqual(['a', 'b']);
  });

  it('initializes the marker as null', () => {
    const result = groupEventsByLocation([event()]);

    expect(result['33.4-111.9'].marker).toBeNull();
  });

  it('skips events without a location', () => {
    const result = groupEventsByLocation([event({ location: null })]);

    expect(result).toEqual({});
  });
});

describe('buildMarkerTitle', () => {
  it('names the single event', () => {
    expect(buildMarkerTitle(1, 'Cat Meetup')).toBe(
      'Click to view event: Cat Meetup'
    );
  });

  it('falls back to Untitled Event', () => {
    expect(buildMarkerTitle(1, '')).toBe('Click to view event: Untitled Event');
  });

  it('summarizes multiple events', () => {
    expect(buildMarkerTitle(3)).toBe('Click to view 3 events at this location');
  });
});

describe('buildMarkerHoverContent', () => {
  it('shows the single event title', () => {
    expect(buildMarkerHoverContent(1, 'Cat Meetup')).toContain('<b>Cat Meetup</b>');
  });

  it('shows the event count for multiple events', () => {
    expect(buildMarkerHoverContent(2)).toContain('<b>2 events</b>');
  });

  it('appends the location name when present', () => {
    expect(buildMarkerHoverContent(1, 'Cat Meetup', 'Downtown')).toContain(
      '<br>at Downtown'
    );
  });

  it('omits the location suffix when absent', () => {
    expect(buildMarkerHoverContent(1, 'Cat Meetup')).not.toContain('<br>at');
  });
});

describe('buildClusterColor', () => {
  it('uses red for large clusters', () => {
    expect(buildClusterColor(11)).toBe('#ef4444');
  });

  it('uses blue for small clusters', () => {
    expect(buildClusterColor(10)).toBe('#3b82f6');
  });
});

describe('calculateClusterZoom', () => {
  it('zooms in by one level', () => {
    expect(calculateClusterZoom(7)).toBe(8);
  });

  it('caps the zoom at the maximum', () => {
    expect(calculateClusterZoom(18)).toBe(18);
  });
});
