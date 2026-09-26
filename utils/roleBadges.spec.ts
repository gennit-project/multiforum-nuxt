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

  it('flags a server mod by mod-profile name', () => {
    expect(
      getAuthorBadges({
        modProfileName: 'mod-bob',
        serverModProfileNames: ['mod-bob'],
      }).isServerMod
    ).toBe(true);
  });

  // The account behind a mod profile is private, so a regular username never
  // earns a mod badge, even if it resembles a moderator's profile name.
  it('never flags a server mod by username', () => {
    expect(
      getAuthorBadges({ username: 'mod-bob', serverModProfileNames: ['mod-bob'] })
        .isServerMod
    ).toBe(false);
  });

  it('suppresses Server Mod for a server admin (admin implies mod)', () => {
    const badges = getAuthorBadges({
      username: 'alice',
      modProfileName: 'mod-alice',
      serverAdminUsernames: ['alice'],
      serverModProfileNames: ['mod-alice'],
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

  it('flags a forum mod by mod-profile name', () => {
    expect(
      getAuthorBadges({
        modProfileName: 'mod-dave',
        forumModProfileNames: ['mod-dave'],
      }).isForumMod
    ).toBe(true);
  });

  it('never flags a forum mod by username', () => {
    expect(
      getAuthorBadges({ username: 'mod-dave', forumModProfileNames: ['mod-dave'] })
        .isForumMod
    ).toBe(false);
  });

  it('suppresses Forum Mod for a channel owner (owner implies mod)', () => {
    const badges = getAuthorBadges({
      username: 'carol',
      modProfileName: 'mod-carol',
      forumAdminUsernames: ['carol'],
      forumModProfileNames: ['mod-carol'],
    });
    expect(badges.isForumAdmin).toBe(true);
    expect(badges.isForumMod).toBe(false);
  });

  it('resolves server and forum badges independently', () => {
    const badges = getAuthorBadges({
      username: 'eve',
      modProfileName: 'mod-eve',
      serverAdminUsernames: ['eve'],
      forumModProfileNames: ['mod-eve'],
    });
    expect(badges).toEqual({
      isServerAdmin: true,
      isServerMod: false,
      isForumAdmin: false,
      isForumMod: true,
    });
  });
});
