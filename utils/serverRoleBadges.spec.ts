import { describe, expect, it } from 'vitest';
import { getServerRoleBadge } from './serverRoleBadges';

describe('getServerRoleBadge', () => {
  it('returns serverAdmin when username belongs to a server admin', () => {
    expect(
      getServerRoleBadge({
        username: 'alice',
        adminUsernames: ['alice'],
      })
    ).toBe('serverAdmin');
  });

  it('returns serverMod when mod profile belongs to a server moderator', () => {
    expect(
      getServerRoleBadge({
        modProfileName: 'Mod Alice',
        modProfileNames: ['Mod Alice'],
      })
    ).toBe('serverMod');
  });

  it('never returns serverMod for a username match', () => {
    expect(
      getServerRoleBadge({
        username: 'alice',
        modProfileNames: ['alice'],
      })
    ).toBe(null);
  });

  it('prefers serverAdmin over serverMod when both match', () => {
    expect(
      getServerRoleBadge({
        username: 'alice',
        modProfileName: 'mod-alice',
        adminUsernames: ['alice'],
        modProfileNames: ['mod-alice'],
      })
    ).toBe('serverAdmin');
  });

  it('returns null when there is no server-scoped membership match', () => {
    expect(
      getServerRoleBadge({
        username: 'alice',
        adminUsernames: [],
        modUsernames: [],
        modProfileNames: [],
      })
    ).toBeNull();
  });
});
