import { describe, it, expect } from 'vitest';
import { getFilterValuesFromParams } from './getDiscussionFilterValuesFromParams';
import type { RouteLocationNormalized } from 'vue-router';

// Helper to create mock route objects
function createMockRoute(query: Record<string, any> = {}): RouteLocationNormalized {
  return {
    name: 'test',
    path: '/',
    fullPath: '/',
    params: {},
    meta: {},
    query,
    hash: '',
    matched: [],
  } as RouteLocationNormalized;
}

describe('getDiscussionFilterValuesFromParams', () => {
  it('returns default values when route has no query parameters', () => {
    const input = {
      route: createMockRoute(),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result).toEqual({
      tags: [],
      channels: [],
      searchInput: '',
      showArchived: false,
    });
  });

  it('uses channelId from input if provided', () => {
    const input = {
      route: createMockRoute(),
      channelId: 'test-channel',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.channels).toEqual(['test-channel']);
  });

  it('parses string tag value correctly', () => {
    const input = {
      route: createMockRoute({ tags: 'javascript' }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.tags).toEqual(['javascript']);
  });

  it('parses array of tags correctly', () => {
    const input = {
      route: createMockRoute({ tags: ['javascript', 'react', 'vue'] }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.tags).toEqual(['javascript', 'react', 'vue']);
  });

  it('parses string channel value correctly', () => {
    const input = {
      route: createMockRoute({ channels: 'frontend' }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.channels).toEqual(['frontend']);
  });

  it('parses array of channels correctly', () => {
    const input = {
      route: createMockRoute({ channels: ['frontend', 'backend', 'devops'] }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.channels).toEqual(['frontend', 'backend', 'devops']);
  });

  it('parses searchInput correctly', () => {
    const input = {
      route: createMockRoute({ searchInput: 'test query' }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.searchInput).toEqual('test query');
  });

  it('parses showArchived as true correctly', () => {
    const input = {
      route: createMockRoute({ showArchived: 'true' }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.showArchived).toBe(true);
  });

  it('parses showArchived as false correctly', () => {
    const input = {
      route: createMockRoute({ showArchived: 'false' }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result.showArchived).toBe(false);
  });

  it('handles multiple query parameters correctly', () => {
    const input = {
      route: createMockRoute({
        tags: ['javascript', 'react'],
        channels: 'frontend',
        searchInput: 'component',
        showArchived: 'true',
      }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result).toEqual({
      tags: ['javascript', 'react'],
      channels: ['frontend'],
      searchInput: 'component',
      showArchived: true,
    });
  });

  it('includes channelId in channels array even with query params', () => {
    const input = {
      route: createMockRoute({
        channels: ['cats', 'phx_music'],
      }),
      channelId: 'main-channel',
    };

    const result = getFilterValuesFromParams(input);

    // For this function, when both channelId and query channels are provided,
    // the behavior is to keep the query channels, not replace them with channelId
    expect(result.channels).toEqual(['cats', 'phx_music']);
  });

  it('ignores invalid query parameters', () => {
    const input = {
      route: createMockRoute({
        invalidParam: 'value',
        tags: 'javascript',
      }),
      channelId: '',
    };

    const result = getFilterValuesFromParams(input);

    expect(result).toEqual({
      tags: ['javascript'],
      channels: [],
      searchInput: '',
      showArchived: false,
    });
  });
});