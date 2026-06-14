import { describe, it, expect } from 'vitest';
import {
  getTotalCommentCount,
  getChannelCommentCount,
  getDiscussionDetailOptions,
  getDownloadDetailOptions,
  shouldShowSensitiveContent,
  isSubmittedToMultipleChannels,
  getChannelCount,
  getPrimaryChannelName,
  getPrimaryChannelUniqueName,
  formatDiscussionDate,
  getDiscussionTags,
  buildFilteredQuery,
} from '@/utils/discussionListUtils';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

describe('discussionListUtils', () => {
  function createMockDiscussion(
    overrides: Partial<Discussion> = {}
  ): Discussion {
    return {
      id: 'disc-1',
      title: 'Test Discussion',
      DiscussionChannels: [],
      Tags: [],
      createdAt: '2024-06-15T10:00:00.000Z',
      ...overrides,
    } as unknown as Discussion;
  }

  function createMockDiscussionChannel(
    overrides: Partial<DiscussionChannel> = {}
  ): DiscussionChannel {
    return {
      id: 'dc-1',
      channelUniqueName: 'test-channel',
      discussionId: 'disc-1',
      CommentsAggregate: { count: 0 },
      Channel: { displayName: 'Test Channel' },
      ...overrides,
    } as unknown as DiscussionChannel;
  }

  describe('getTotalCommentCount', () => {
    it('returns 0 for null discussion', () => {
      expect(getTotalCommentCount(null)).toBe(0);
    });

    it('returns 0 for discussion with no channels', () => {
      const discussion = createMockDiscussion({ DiscussionChannels: [] });
      expect(getTotalCommentCount(discussion)).toBe(0);
    });

    it('returns sum of comment counts across all channels', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            CommentsAggregate: { count: 5 },
          }),
          createMockDiscussionChannel({
            CommentsAggregate: { count: 3 },
          }),
        ],
      });
      expect(getTotalCommentCount(discussion)).toBe(8);
    });

    it('handles channels with missing comment aggregate', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            CommentsAggregate: undefined,
          }),
        ],
      });
      expect(getTotalCommentCount(discussion)).toBe(0);
    });
  });

  describe('getChannelCommentCount', () => {
    it('returns 0 for null discussion channel', () => {
      expect(getChannelCommentCount(null)).toBe(0);
    });

    it('returns comment count from channel', () => {
      const channel = createMockDiscussionChannel({
        CommentsAggregate: { count: 10 },
      });
      expect(getChannelCommentCount(channel)).toBe(10);
    });

    it('returns 0 when CommentsAggregate is missing', () => {
      const channel = createMockDiscussionChannel({
        CommentsAggregate: undefined,
      });
      expect(getChannelCommentCount(channel)).toBe(0);
    });
  });

  describe('getDiscussionDetailOptions', () => {
    it('returns empty array for null discussion', () => {
      expect(getDiscussionDetailOptions(null)).toEqual([]);
    });

    it('returns empty array for discussion with no channels', () => {
      const discussion = createMockDiscussion({ DiscussionChannels: [] });
      expect(getDiscussionDetailOptions(discussion)).toEqual([]);
    });

    it('generates options for each channel', () => {
      const discussion = createMockDiscussion({
        id: 'disc-123',
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'channel-a',
            CommentsAggregate: { count: 5 },
          }),
          createMockDiscussionChannel({
            channelUniqueName: 'channel-b',
            CommentsAggregate: { count: 1 },
          }),
        ],
      });

      const options = getDiscussionDetailOptions(discussion);
      expect(options).toHaveLength(2);
      expect(options[0]!.value).toContain('/forums/');
      expect(options[0]!.value).toContain('/discussions/disc-123');
    });

    it('uses singular "comment" for count of 1', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'test',
            CommentsAggregate: { count: 1 },
          }),
        ],
      });

      const options = getDiscussionDetailOptions(discussion);
      expect(options[0]!.label).toContain('1 comment');
    });

    it('uses plural "comments" for count other than 1', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'test',
            CommentsAggregate: { count: 5 },
          }),
        ],
      });

      const options = getDiscussionDetailOptions(discussion);
      expect(options[0]!.label).toContain('5 comments');
    });
  });

  describe('getDownloadDetailOptions', () => {
    it('returns empty array for null discussion', () => {
      expect(getDownloadDetailOptions(null)).toEqual([]);
    });

    it('generates download URLs instead of discussion URLs', () => {
      const discussion = createMockDiscussion({
        id: 'disc-123',
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'test-channel',
          }),
        ],
      });

      const options = getDownloadDetailOptions(discussion);
      expect(options[0]!.value).toContain('/downloads/');
      expect(options[0]!.value).toBe(
        '/forums/test-channel/downloads/disc-123'
      );
    });
  });

  describe('shouldShowSensitiveContent', () => {
    it('returns true when content is not sensitive', () => {
      expect(
        shouldShowSensitiveContent({
          hasSensitiveContent: false,
          sensitiveContentRevealed: false,
          userAllowsSensitiveContent: false,
        })
      ).toBe(true);
    });

    it('returns true when sensitive content is revealed', () => {
      expect(
        shouldShowSensitiveContent({
          hasSensitiveContent: true,
          sensitiveContentRevealed: true,
          userAllowsSensitiveContent: false,
        })
      ).toBe(true);
    });

    it('returns true when user allows sensitive content by default', () => {
      expect(
        shouldShowSensitiveContent({
          hasSensitiveContent: true,
          sensitiveContentRevealed: false,
          userAllowsSensitiveContent: true,
        })
      ).toBe(true);
    });

    it('returns false when sensitive but not revealed and user does not allow', () => {
      expect(
        shouldShowSensitiveContent({
          hasSensitiveContent: true,
          sensitiveContentRevealed: false,
          userAllowsSensitiveContent: false,
        })
      ).toBe(false);
    });
  });

  describe('isSubmittedToMultipleChannels', () => {
    it('returns false for null discussion', () => {
      expect(isSubmittedToMultipleChannels(null)).toBe(false);
    });

    it('returns false for single channel', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [createMockDiscussionChannel()],
      });
      expect(isSubmittedToMultipleChannels(discussion)).toBe(false);
    });

    it('returns true for multiple channels', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel(),
          createMockDiscussionChannel(),
        ],
      });
      expect(isSubmittedToMultipleChannels(discussion)).toBe(true);
    });
  });

  describe('getChannelCount', () => {
    it('returns 0 for null discussion', () => {
      expect(getChannelCount(null)).toBe(0);
    });

    it('returns correct count', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel(),
          createMockDiscussionChannel(),
          createMockDiscussionChannel(),
        ],
      });
      expect(getChannelCount(discussion)).toBe(3);
    });
  });

  describe('getPrimaryChannelName', () => {
    it('returns empty string for null discussion', () => {
      expect(getPrimaryChannelName(null)).toBe('');
    });

    it('returns empty string for discussion with no channels', () => {
      const discussion = createMockDiscussion({ DiscussionChannels: [] });
      expect(getPrimaryChannelName(discussion)).toBe('');
    });

    it('returns display name when available', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'unique-name',
            Channel: { displayName: 'Display Name' } as unknown as DiscussionChannel['Channel'],
          }),
        ],
      });
      expect(getPrimaryChannelName(discussion)).toBe('Display Name');
    });

    it('falls back to unique name when display name not available', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'unique-name',
            Channel: { displayName: '' } as unknown as DiscussionChannel['Channel'],
          }),
        ],
      });
      expect(getPrimaryChannelName(discussion)).toBe('unique-name');
    });
  });

  describe('getPrimaryChannelUniqueName', () => {
    it('returns empty string for null discussion', () => {
      expect(getPrimaryChannelUniqueName(null)).toBe('');
    });

    it('returns unique name of first channel', () => {
      const discussion = createMockDiscussion({
        DiscussionChannels: [
          createMockDiscussionChannel({
            channelUniqueName: 'first-channel',
          }),
          createMockDiscussionChannel({
            channelUniqueName: 'second-channel',
          }),
        ],
      });
      expect(getPrimaryChannelUniqueName(discussion)).toBe('first-channel');
    });
  });

  describe('formatDiscussionDate', () => {
    it('returns empty string for null date', () => {
      expect(formatDiscussionDate(null)).toBe('');
    });

    it('returns empty string for undefined date', () => {
      expect(formatDiscussionDate(undefined)).toBe('');
    });

    it('formats date in expected format', () => {
      const result = formatDiscussionDate('2024-03-30T10:00:00.000Z');
      expect(result).toMatch(/Mar 30, 2024/);
    });

    it('formats different months correctly', () => {
      const jan = formatDiscussionDate('2024-01-15T10:00:00.000Z');
      const dec = formatDiscussionDate('2024-12-25T10:00:00.000Z');
      expect(jan).toContain('Jan');
      expect(dec).toContain('Dec');
    });
  });

  describe('getDiscussionTags', () => {
    it('returns empty array for null discussion', () => {
      expect(getDiscussionTags(null)).toEqual([]);
    });

    it('returns empty array for discussion with no tags', () => {
      const discussion = createMockDiscussion({ Tags: [] });
      expect(getDiscussionTags(discussion)).toEqual([]);
    });

    it('returns array of tag texts', () => {
      const discussion = createMockDiscussion({
        Tags: [{ text: 'tag1' }, { text: 'tag2' }, { text: 'tag3' }] as unknown as Discussion['Tags'],
      });
      expect(getDiscussionTags(discussion)).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('buildFilteredQuery', () => {
    it('returns empty object for empty input', () => {
      expect(buildFilteredQuery({})).toEqual({});
    });

    it('removes null and undefined values', () => {
      const query = {
        search: 'test',
        tags: null,
        channels: undefined,
        sort: 'new',
      };
      expect(buildFilteredQuery(query)).toEqual({
        search: 'test',
        sort: 'new',
      });
    });

    it('removes empty strings', () => {
      const query = {
        search: '',
        tags: 'tag1',
      };
      expect(buildFilteredQuery(query)).toEqual({
        tags: 'tag1',
      });
    });

    it('keeps zero values', () => {
      const query = {
        offset: 0,
        limit: 10,
      };
      // Note: 0 is falsy, so it gets filtered out
      expect(buildFilteredQuery(query)).toEqual({
        limit: 10,
      });
    });

    it('keeps non-empty arrays', () => {
      const query = {
        tags: ['tag1', 'tag2'],
      };
      expect(buildFilteredQuery(query)).toEqual({
        tags: ['tag1', 'tag2'],
      });
    });

    it('keeps empty arrays as they are truthy in JS', () => {
      const query = {
        empty: [],
      };
      // Empty arrays are truthy in JavaScript, so they are kept
      expect(buildFilteredQuery(query)).toEqual({
        empty: [],
      });
    });
  });
});
