import { describe, it, expect } from 'vitest';
import {
  getReportCount,
  formatReportCountLabel,
  hasRelatedContent,
  isRelatedCommentAuthorBot,
  resolveAuthorType,
} from './issueDetailDisplay';

describe('getReportCount', () => {
  it('returns the aggregate count when present', () => {
    expect(getReportCount({ ActivityFeedAggregate: { count: 3 } })).toBe(3);
  });

  it('returns 0 when the count is zero', () => {
    expect(getReportCount({ ActivityFeedAggregate: { count: 0 } })).toBe(0);
  });

  it('returns null when the issue is null', () => {
    expect(getReportCount(null)).toBeNull();
  });

  it('returns null when the aggregate is missing', () => {
    expect(getReportCount({})).toBeNull();
  });
});

describe('formatReportCountLabel', () => {
  it('returns an empty string for a null count', () => {
    expect(formatReportCountLabel(null)).toBe('');
  });

  it('uses the singular form for one report', () => {
    expect(formatReportCountLabel(1)).toBe('1 report');
  });

  it('uses the plural form for zero reports', () => {
    expect(formatReportCountLabel(0)).toBe('0 reports');
  });

  it('uses the plural form for multiple reports', () => {
    expect(formatReportCountLabel(5)).toBe('5 reports');
  });
});

describe('hasRelatedContent', () => {
  it.each([
    ['relatedDiscussionId', { relatedDiscussionId: 'd1' }],
    ['relatedEventId', { relatedEventId: 'e1' }],
    ['relatedCommentId', { relatedCommentId: 'c1' }],
    ['relatedWikiPageId', { relatedWikiPageId: 'w1' }],
    ['relatedWikiRevisionId', { relatedWikiRevisionId: 'r1' }],
  ])('is true when %s is set', (_label, issue) => {
    expect(hasRelatedContent(issue)).toBe(true);
  });

  it('is false when no related ids are set', () => {
    expect(hasRelatedContent({})).toBe(false);
  });

  it('is false for a null issue', () => {
    expect(hasRelatedContent(null)).toBe(false);
  });
});

describe('isRelatedCommentAuthorBot', () => {
  it('is true when the User author is a bot', () => {
    expect(
      isRelatedCommentAuthorBot({
        CommentAuthor: { __typename: 'User', isBot: true },
      })
    ).toBe(true);
  });

  it('is false when the User author is not a bot', () => {
    expect(
      isRelatedCommentAuthorBot({
        CommentAuthor: { __typename: 'User', isBot: false },
      })
    ).toBe(false);
  });

  it('is false when the author is a mod profile', () => {
    expect(
      isRelatedCommentAuthorBot({
        CommentAuthor: { __typename: 'ModerationProfile', isBot: true },
      })
    ).toBe(false);
  });

  it('is false when there is no related comment', () => {
    expect(isRelatedCommentAuthorBot(null)).toBe(false);
  });
});

describe('resolveAuthorType', () => {
  it('resolves to mod when a mod profile name is present', () => {
    expect(resolveAuthorType({ modProfileName: 'modBob', username: '' })).toBe(
      'mod'
    );
  });

  it('prefers mod even when a username is also present', () => {
    expect(
      resolveAuthorType({ modProfileName: 'modBob', username: 'bob' })
    ).toBe('mod');
  });

  it('resolves to user when only a username is present', () => {
    expect(resolveAuthorType({ modProfileName: '', username: 'bob' })).toBe(
      'user'
    );
  });

  it('falls back to user when neither identifier is present', () => {
    expect(resolveAuthorType({ modProfileName: '', username: '' })).toBe(
      'user'
    );
  });
});
