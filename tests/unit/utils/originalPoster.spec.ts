import { describe, it, expect } from 'vitest';
import {
  isCurrentUserOriginalPoster,
  getIssueActionVisibility,
  getOriginalPoster,
} from '@/utils/originalPoster';

describe('isCurrentUserOriginalPoster', () => {
  it('returns true when usernames match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        currentUsername: 'alice',
      })
    ).toBe(true);
  });

  it('returns true when mod profile names match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalModProfileName: 'ModAlice',
        currentModProfileName: 'ModAlice',
      })
    ).toBe(true);
  });

  it('returns true when user is OP even if also a mod', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        originalModProfileName: 'ModAlice',
        currentUsername: 'alice',
        currentModProfileName: 'ModAlice',
      })
    ).toBe(true);
  });

  it('returns false when usernames do not match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        currentUsername: 'bob',
      })
    ).toBe(false);
  });

  it('returns false when mod profile names do not match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalModProfileName: 'ModAlice',
        currentModProfileName: 'ModBob',
      })
    ).toBe(false);
  });

  it('returns false when no identifiers are provided', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: '',
        originalModProfileName: '',
        currentUsername: '',
        currentModProfileName: '',
      })
    ).toBe(false);
  });
});

describe('getIssueActionVisibility', () => {
  it('OP only has OP actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: true,
      })
    ).toMatchObject({
      opActionsEnabled: true,
      modActionsEnabled: false,
    });
  });

  it('non-author only has mod actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: false,
      })
    ).toMatchObject({
      opActionsEnabled: false,
      modActionsEnabled: true,
    });
  });

  it('returns both actions disabled when there is no related content', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: false,
        isOriginalPoster: true,
      })
    ).toMatchObject({
      opActionsEnabled: false,
      modActionsEnabled: false,
    });
  });
});

describe('original poster lookup', () => {
  it('reads username from Discussion.Author', () => {
    expect(
      getOriginalPoster({ Discussion: { Author: { username: 'discussion-author' } } })
    ).toEqual({ username: 'discussion-author', modProfileName: '' });
  });

  it('reads username from Event.Poster', () => {
    expect(
      getOriginalPoster({ Event: { Poster: { username: 'event-poster' } } })
    ).toEqual({ username: 'event-poster', modProfileName: '' });
  });

  it('reads user from Comment.CommentAuthor', () => {
    expect(
      getOriginalPoster({
        Comment: {
          CommentAuthor: { __typename: 'User', username: 'comment-author' },
        },
      })
    ).toEqual({ username: 'comment-author', modProfileName: '' });
  });

  it('reads mod profile from Comment.CommentAuthor', () => {
    expect(
      getOriginalPoster({
        Comment: {
          CommentAuthor: {
            __typename: 'ModerationProfile',
            displayName: 'ModAuthor',
          },
        },
      })
    ).toEqual({ username: '', modProfileName: 'ModAuthor' });
  });
});
