import { describe, it, expect } from 'vitest';
import { getFilterValuesFromParams } from '@/components/discussion/list/getDiscussionFilterValuesFromParams';
import type { RouteLocationNormalized } from 'vue-router';

const createMockRoute = (
  query: Record<string, string | string[] | null | undefined> = {}
): RouteLocationNormalized =>
  ({
    query,
    params: {},
    path: '/discussions',
    name: 'discussions',
    fullPath: '/discussions',
    hash: '',
    matched: [],
    meta: {},
    redirectedFrom: undefined,
  }) as RouteLocationNormalized;

describe('getFilterValuesFromParams', () => {
  describe('default values', () => {
    it('returns empty arrays and defaults when query is empty', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute(),
        channelId: '',
      });

      expect(result).toEqual({
        tags: [],
        channels: [],
        searchInput: '',
        showArchived: false,
        showUnanswered: false,
      });
    });

    it('includes channelId in channels when provided', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute(),
        channelId: 'cats',
      });

      expect(result.channels).toEqual(['cats']);
    });
  });

  describe('tags parameter', () => {
    it('parses single tag as string', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ tags: 'trivia' }),
        channelId: '',
      });

      expect(result.tags).toEqual(['trivia']);
    });

    it('parses multiple tags as array', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ tags: ['trivia', 'music'] }),
        channelId: '',
      });

      expect(result.tags).toEqual(['trivia', 'music']);
    });

    it('filters out non-string values from tags array', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({
          tags: ['trivia', null, 'music', undefined] as unknown as string[],
        }),
        channelId: '',
      });

      expect(result.tags).toEqual(['trivia', 'music']);
    });
  });

  describe('channels parameter', () => {
    it('parses single channel as string', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ channels: 'cats' }),
        channelId: '',
      });

      expect(result.channels).toEqual(['cats']);
    });

    it('parses multiple channels as array', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ channels: ['cats', 'dogs'] }),
        channelId: '',
      });

      expect(result.channels).toEqual(['cats', 'dogs']);
    });

    it('query channels override channelId', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ channels: ['dogs'] }),
        channelId: 'cats',
      });

      expect(result.channels).toEqual(['dogs']);
    });
  });

  describe('searchInput parameter', () => {
    it('parses searchInput string', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ searchInput: 'test query' }),
        channelId: '',
      });

      expect(result.searchInput).toBe('test query');
    });

    it('ignores non-string searchInput', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({
          searchInput: ['array'] as unknown as string,
        }),
        channelId: '',
      });

      expect(result.searchInput).toBe('');
    });
  });

  describe('showArchived parameter', () => {
    it('parses "true" string as true', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ showArchived: 'true' }),
        channelId: '',
      });

      expect(result.showArchived).toBe(true);
    });

    it('parses "false" string as false', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ showArchived: 'false' }),
        channelId: '',
      });

      expect(result.showArchived).toBe(false);
    });

    it('defaults to false for other values', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ showArchived: 'yes' }),
        channelId: '',
      });

      expect(result.showArchived).toBe(false);
    });
  });

  describe('showUnanswered parameter', () => {
    it('parses "true" string as true', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ showUnanswered: 'true' }),
        channelId: '',
      });

      expect(result.showUnanswered).toBe(true);
    });

    it('parses "false" string as false', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({ showUnanswered: 'false' }),
        channelId: '',
      });

      expect(result.showUnanswered).toBe(false);
    });
  });

  describe('combined parameters', () => {
    it('parses all parameters together', () => {
      const result = getFilterValuesFromParams({
        route: createMockRoute({
          tags: ['trivia', 'music'],
          channels: ['cats'],
          searchInput: 'test',
          showArchived: 'true',
          showUnanswered: 'false',
        }),
        channelId: '',
      });

      expect(result).toEqual({
        tags: ['trivia', 'music'],
        channels: ['cats'],
        searchInput: 'test',
        showArchived: true,
        showUnanswered: false,
      });
    });
  });
});
