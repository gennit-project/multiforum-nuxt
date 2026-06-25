import { describe, it, expect } from 'vitest';
import {
  getOriginalPoster,
  isCurrentUserOriginalPoster,
  getIssueActionVisibility,
} from './originalPoster';

describe('getOriginalPoster', () => {
  it('reads the discussion author', () => {
    expect(
      getOriginalPoster({ Discussion: { Author: { username: 'alice' } } })
    ).toEqual({ username: 'alice', modProfileName: '' });
  });

  it('reads the event poster', () => {
    expect(
      getOriginalPoster({ Event: { Poster: { username: 'bob' } } }).username
    ).toBe('bob');
  });

  it('reads a User comment author', () => {
    expect(
      getOriginalPoster({
        Comment: { CommentAuthor: { __typename: 'User', username: 'carol' } },
      }).username
    ).toBe('carol');
  });

  it('reads a ModerationProfile comment author as a mod profile name', () => {
    expect(
      getOriginalPoster({
        Comment: {
          CommentAuthor: { __typename: 'ModerationProfile', displayName: 'Mod' },
        },
      })
    ).toEqual({ username: '', modProfileName: 'Mod' });
  });

  it('returns empty values when there is no recognizable author', () => {
    expect(getOriginalPoster({})).toEqual({ username: '', modProfileName: '' });
  });
});

describe('isCurrentUserOriginalPoster', () => {
  it('matches the user author', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        currentUsername: 'alice',
      })
    ).toBe(true);
  });

  it('matches the moderation-profile author', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalModProfileName: 'Mod',
        currentModProfileName: 'Mod',
      })
    ).toBe(true);
  });

  it('does not match a different user', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        currentUsername: 'bob',
      })
    ).toBe(false);
  });
});

describe('getIssueActionVisibility', () => {
  it('hides all actions when there is no related content', () => {
    expect(
      getIssueActionVisibility({ hasRelatedContent: false, isOriginalPoster: true })
    ).toMatchObject({ showOpActions: false, showModActions: false });
  });

  it('enables OP actions for the original poster', () => {
    expect(
      getIssueActionVisibility({ hasRelatedContent: true, isOriginalPoster: true })
    ).toMatchObject({ opActionsEnabled: true, modActionsEnabled: false });
  });

  it('enables mod actions for a non-original poster', () => {
    expect(
      getIssueActionVisibility({ hasRelatedContent: true, isOriginalPoster: false })
    ).toMatchObject({ opActionsEnabled: false, modActionsEnabled: true });
  });
});
