import { describe, it, expect } from 'vitest';
import { getForumRoleBadge } from './forumRoleBadges';

describe('getForumRoleBadge', () => {
  it('returns forumAdmin when the username is a forum admin', () => {
    expect(
      getForumRoleBadge({ username: 'alice', adminUsernames: ['alice'] })
    ).toBe('forumAdmin');
  });

  it('returns forumMod when the username is a forum mod', () => {
    expect(
      getForumRoleBadge({ username: 'bob', modUsernames: ['bob'] })
    ).toBe('forumMod');
  });

  it('returns forumMod when the mod-profile name matches', () => {
    expect(
      getForumRoleBadge({ modProfileName: 'ModBob', modProfileNames: ['ModBob'] })
    ).toBe('forumMod');
  });

  it('prefers admin over mod when both match', () => {
    expect(
      getForumRoleBadge({
        username: 'alice',
        adminUsernames: ['alice'],
        modUsernames: ['alice'],
      })
    ).toBe('forumAdmin');
  });

  it('returns null when there is no matching role', () => {
    expect(getForumRoleBadge({ username: 'carol' })).toBeNull();
  });
});
