import { describe, it, expect } from 'vitest';
import { isEventSearchRoute } from './isEventSearchRoute';

describe('isEventSearchRoute', () => {
  it('returns false for nullish routes', () => {
    expect(isEventSearchRoute(null)).toBe(false);
  });

  it('matches routes by name prefix', () => {
    expect(isEventSearchRoute({ name: 'events-list-search-eventId' })).toBe(
      true
    );
  });

  it('matches routes by path prefix when the name is absent', () => {
    expect(isEventSearchRoute({ path: '/events/list/search/abc' })).toBe(true);
  });

  it('returns false for unrelated route names and paths', () => {
    expect(
      isEventSearchRoute({
        name: 'events-map-search',
        path: '/events/map',
      })
    ).toBe(false);
  });
});
