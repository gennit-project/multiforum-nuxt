import { describe, it, expect } from 'vitest';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';
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
} from './discussionListUtils';

const discussion = (channels: unknown[]): Discussion =>
  ({ id: 'd1', DiscussionChannels: channels } as unknown as Discussion);

describe('getTotalCommentCount', () => {
  it('sums comment counts across channels', () => {
    expect(
      getTotalCommentCount(
        discussion([
          { CommentsAggregate: { count: 2 } },
          { CommentsAggregate: { count: 3 } },
        ])
      )
    ).toBe(5);
  });

  it('returns 0 for a null discussion', () => {
    expect(getTotalCommentCount(null)).toBe(0);
  });
});

describe('getChannelCommentCount', () => {
  it('reads the channel comment count', () => {
    expect(
      getChannelCommentCount({
        CommentsAggregate: { count: 4 },
      } as unknown as DiscussionChannel)
    ).toBe(4);
  });

  it('returns 0 for a null channel', () => {
    expect(getChannelCommentCount(null)).toBe(0);
  });
});

describe('getDiscussionDetailOptions', () => {
  it('builds a labeled, sorted option per channel', () => {
    expect(
      getDiscussionDetailOptions(
        discussion([
          { channelUniqueName: 'cats', CommentsAggregate: { count: 1 } },
        ])
      )[0]
    ).toEqual({
      label: '1 comment in cats',
      value: '/forums/cats/discussions/d1',
    });
  });

  it('returns an empty array for a null discussion', () => {
    expect(getDiscussionDetailOptions(null)).toEqual([]);
  });
});

describe('getDownloadDetailOptions', () => {
  it('links to the downloads path', () => {
    expect(
      getDownloadDetailOptions(
        discussion([
          { channelUniqueName: 'cats', CommentsAggregate: { count: 2 } },
        ])
      )[0].value
    ).toBe('/forums/cats/downloads/d1');
  });
});

describe('shouldShowSensitiveContent', () => {
  it('shows content that is not sensitive', () => {
    expect(
      shouldShowSensitiveContent({
        hasSensitiveContent: false,
        sensitiveContentRevealed: false,
        userAllowsSensitiveContent: false,
      })
    ).toBe(true);
  });

  it('hides sensitive content that has not been revealed or allowed', () => {
    expect(
      shouldShowSensitiveContent({
        hasSensitiveContent: true,
        sensitiveContentRevealed: false,
        userAllowsSensitiveContent: false,
      })
    ).toBe(false);
  });
});

describe('channel count helpers', () => {
  it('detects multi-channel submission', () => {
    expect(
      isSubmittedToMultipleChannels(discussion([{}, {}]))
    ).toBe(true);
  });

  it('counts the channels', () => {
    expect(getChannelCount(discussion([{}, {}, {}]))).toBe(3);
  });

  it('prefers the display name for the primary channel', () => {
    expect(
      getPrimaryChannelName(
        discussion([{ channelUniqueName: 'cats', Channel: { displayName: 'Cats' } }])
      )
    ).toBe('Cats');
  });

  it('returns the primary channel unique name', () => {
    expect(
      getPrimaryChannelUniqueName(discussion([{ channelUniqueName: 'cats' }]))
    ).toBe('cats');
  });
});

describe('formatDiscussionDate', () => {
  it('returns an empty string for no date', () => {
    expect(formatDiscussionDate(null)).toBe('');
  });

  it('formats an ISO date as a short US date', () => {
    expect(formatDiscussionDate('2023-03-30T12:00:00Z')).toMatch(/Mar 30, 2023/);
  });
});

describe('getDiscussionTags', () => {
  it('maps tag objects to their text', () => {
    expect(
      getDiscussionTags({
        Tags: [{ text: 'a' }, { text: 'b' }],
      } as unknown as Discussion)
    ).toEqual(['a', 'b']);
  });
});

describe('buildFilteredQuery', () => {
  it('drops empty values', () => {
    expect(
      buildFilteredQuery({ a: 'x', b: '', c: undefined, d: 0, e: 'y' })
    ).toEqual({ a: 'x', e: 'y' });
  });
});
