import { describe, expect, it } from 'vitest';

import {
  canEditWikiPage,
  canManageLockedWikiPage,
} from '@/utils/wikiPageLockPermissions';

describe('wikiPageLockPermissions', () => {
  it('allows a channel owner when no elevated role is configured', () => {
    expect(
      canManageLockedWikiPage({
        channel: { Admins: [{ username: 'alice' }], ElevatedChannelRole: null },
        username: 'alice',
      })
    ).toBe(true);
  });

  it('requires elevated canUpdateChannel when the elevated role is configured', () => {
    expect(
      canManageLockedWikiPage({
        channel: {
          Admins: [{ username: 'alice' }],
          ElevatedChannelRole: { canUpdateChannel: false },
        },
        username: 'alice',
      })
    ).toBe(false);
  });

  it('blocks non-owners from managing locked wiki pages', () => {
    expect(
      canManageLockedWikiPage({
        channel: {
          Admins: [{ username: 'alice' }],
          ElevatedChannelRole: { canUpdateChannel: true },
        },
        username: 'bob',
      })
    ).toBe(false);
  });

  it('allows unlocked wiki pages to be edited', () => {
    expect(canEditWikiPage({ wikiPage: { locked: false } })).toBe(true);
  });

  it('blocks locked wiki page edits without owner permission', () => {
    expect(
      canEditWikiPage({
        wikiPage: { locked: true },
        channel: { Admins: [{ username: 'alice' }] },
        username: 'bob',
      })
    ).toBe(false);
  });
});
