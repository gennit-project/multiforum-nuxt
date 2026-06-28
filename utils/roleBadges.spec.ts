import { describe, it, expect } from 'vitest';
import { getAuthorBadges } from './roleBadges';

describe('getAuthorBadges', () => {
  it('returns no badges for a user with no roles', () => {
    expect(getAuthorBadges({ username: 'nobody' })).toEqual({
      isServerAdmin: false,
      isServerMod: false,
      isForumAdmin: false,
      isForumMod: false,
    });
  });

  it('flags a server admin', () => {
    const badges = getAuthorBadges({
      username: 'alice',
      serverAdminUsernames: ['alice'],
    });
    expect(badges.isServerAdmin).toBe(true);
  });

  it('flags a server mod (by username and by mod-profile name)', () => {
    expect(
      getAuthorBadges({ username: 'bob', serverModUsernames: ['bob'] })
        .isServerMod
    ).toBe(true);
    expect(
      getAuthorBadges({
        modProfileName: 'mod-bob',
        serverModProfileNames: ['mod-bob'],
      }).isServerMod
    ).toBe(true);
  });

  it('suppresses Server Mod for a server admin (admin implies mod)', () => {
    const badges = getAuthorBadges({
      username: 'alice',
      serverAdminUsernames: ['alice'],
      serverModUsernames: ['alice'],
    });
    expect(badges.isServerAdmin).toBe(true);
    expect(badges.isServerMod).toBe(false);
  });

  it('flags a forum admin (channel owner)', () => {
    const badges = getAuthorBadges({
      username: 'carol',
      forumAdminUsernames: ['carol'],
    });
    expect(badges.isForumAdmin).toBe(true);
    expect(badges.isForumMod).toBe(false);
  });

  it('flags a forum mod (by username and by mod-profile name)', () => {
    expect(
      getAuthorBadges({ username: 'dave', forumModUsernames: ['dave'] })
        .isForumMod
    ).toBe(true);
    expect(
      getAuthorBadges({
        modProfileName: 'mod-dave',
        forumModProfileNames: ['mod-dave'],
      }).isForumMod
    ).toBe(true);
  });

  it('suppresses Forum Mod for a channel owner (owner implies mod)', () => {
    const badges = getAuthorBadges({
      username: 'carol',
      forumAdminUsernames: ['carol'],
      forumModUsernames: ['carol'],
    });
    expect(badges.isForumAdmin).toBe(true);
    expect(badges.isForumMod).toBe(false);
  });

  it('resolves server and forum badges independently', () => {
    const badges = getAuthorBadges({
      username: 'eve',
      serverAdminUsernames: ['eve'],
      forumModUsernames: ['eve'],
    });
    expect(badges).toEqual({
      isServerAdmin: true,
      isServerMod: false,
      isForumAdmin: false,
      isForumMod: true,
    });
  });
});
