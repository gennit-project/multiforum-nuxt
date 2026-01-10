import { describe, it, expect } from 'vitest';
import { isCurrentUserOriginalPoster } from '@/utils/originalPoster';

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
