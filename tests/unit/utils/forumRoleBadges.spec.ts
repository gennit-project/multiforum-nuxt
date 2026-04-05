import { describe, expect, it } from 'vitest';
import { getForumRoleBadge } from '@/utils/forumRoleBadges';

describe('forumRoleBadges', () => {
  it('returns forumAdmin when the user is both an admin and a mod', () => {
    const result = getForumRoleBadge({
      username: 'alice',
      adminUsernames: ['alice'],
      modUsernames: ['alice'],
      modProfileNames: ['Alice Mod'],
    });

    expect(result).toBe('forumAdmin');
  });

  it('returns forumMod for a user in the forum mod list', () => {
    const result = getForumRoleBadge({
      username: 'bob',
      adminUsernames: ['alice'],
      modUsernames: ['bob'],
    });

    expect(result).toBe('forumMod');
  });

  it('returns forumMod for a moderation profile name in the forum mod list', () => {
    const result = getForumRoleBadge({
      modProfileName: 'Mod Jane',
      modProfileNames: ['Mod Jane'],
    });

    expect(result).toBe('forumMod');
  });

  it('returns null when the author is not in a forum role list', () => {
    const result = getForumRoleBadge({
      username: 'charlie',
      adminUsernames: ['alice'],
      modUsernames: ['bob'],
    });

    expect(result).toBeNull();
  });
});
