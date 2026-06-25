import { describe, it, expect } from 'vitest';
import {
  getCommentReplyCount,
  isCommentSubscribedByUser,
  isCommentOwnedByUser,
  getCommentFeedbackLabel,
} from './commentDisplay';

describe('getCommentReplyCount', () => {
  it('returns the aggregate count when present', () => {
    expect(
      getCommentReplyCount({ ChildCommentsAggregate: { count: 4 } })
    ).toBe(4);
  });

  it('returns 0 when the aggregate is missing', () => {
    expect(getCommentReplyCount({})).toBe(0);
  });

  it('returns 0 for a null comment', () => {
    expect(getCommentReplyCount(null)).toBe(0);
  });
});

describe('isCommentSubscribedByUser', () => {
  const comment = {
    SubscribedToNotifications: [{ username: 'alice' }, { username: 'bob' }],
  };

  it('is true when the user is in the subscriber list', () => {
    expect(isCommentSubscribedByUser(comment, 'bob')).toBe(true);
  });

  it('is false when the user is not subscribed', () => {
    expect(isCommentSubscribedByUser(comment, 'carol')).toBe(false);
  });

  it('is false when there is no username', () => {
    expect(isCommentSubscribedByUser(comment, '')).toBe(false);
  });

  it('is false when there are no subscribers', () => {
    expect(isCommentSubscribedByUser({}, 'alice')).toBe(false);
  });
});

describe('isCommentOwnedByUser', () => {
  it('is true when a User author matches the username', () => {
    expect(
      isCommentOwnedByUser(
        { CommentAuthor: { __typename: 'User', username: 'alice' } },
        'alice'
      )
    ).toBe(true);
  });

  it('is false when the author is a different user', () => {
    expect(
      isCommentOwnedByUser(
        { CommentAuthor: { __typename: 'User', username: 'alice' } },
        'bob'
      )
    ).toBe(false);
  });

  it('is false when the author is a moderation profile', () => {
    expect(
      isCommentOwnedByUser(
        { CommentAuthor: { __typename: 'ModerationProfile', username: 'alice' } },
        'alice'
      )
    ).toBe(false);
  });

  it('is false when there is no current username', () => {
    expect(
      isCommentOwnedByUser(
        { CommentAuthor: { __typename: 'User', username: 'alice' } },
        null
      )
    ).toBe(false);
  });
});

describe('getCommentFeedbackLabel', () => {
  it('returns an empty string when labels are hidden', () => {
    expect(
      getCommentFeedbackLabel({
        showLabel: false,
        comment: { GivesFeedbackOnDiscussion: { id: 'd1' } },
      })
    ).toBe('');
  });

  it('labels feedback on a discussion', () => {
    expect(
      getCommentFeedbackLabel({
        showLabel: true,
        comment: { GivesFeedbackOnDiscussion: { id: 'd1' } },
      })
    ).toBe('Feedback on Discussion');
  });

  it('labels feedback on an event', () => {
    expect(
      getCommentFeedbackLabel({
        showLabel: true,
        comment: { GivesFeedbackOnEvent: { id: 'e1' } },
      })
    ).toBe('Feedback on Event');
  });

  it('labels feedback on a comment', () => {
    expect(
      getCommentFeedbackLabel({
        showLabel: true,
        comment: { GivesFeedbackOnComment: { id: 'c1' } },
      })
    ).toBe('Feedback on Comment');
  });

  it('labels a comment on an issue', () => {
    expect(
      getCommentFeedbackLabel({
        showLabel: true,
        comment: { Issue: { id: 'i1' } },
      })
    ).toBe('Comment on Issue');
  });

  it('returns an empty string for an ordinary comment', () => {
    expect(getCommentFeedbackLabel({ showLabel: true, comment: {} })).toBe('');
  });
});
