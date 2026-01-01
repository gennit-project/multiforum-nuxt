import { describe, it, expect } from 'vitest';
import { getAllPermissions } from './permissionUtils';

describe('permissionUtils', () => {
  it('includes edit permissions from elevated mod role', () => {
    const permissions = getAllPermissions({
      permissionData: {
        Moderators: [{ displayName: 'mod-one' }],
      },
      standardModRole: {
        canEditComments: false,
        canEditDiscussions: false,
        canEditEvents: false,
      },
      elevatedModRole: {
        canEditComments: true,
        canEditDiscussions: true,
        canEditEvents: true,
      },
      username: 'user-one',
      modProfileName: 'mod-one',
    });

    expect(permissions.canEditComments).toBe(true);
    expect(permissions.canEditDiscussions).toBe(true);
    expect(permissions.canEditEvents).toBe(true);
  });

  it('falls back to standard role for edit permissions', () => {
    const permissions = getAllPermissions({
      permissionData: {
        Moderators: [],
      },
      standardModRole: {
        canEditComments: true,
        canEditDiscussions: false,
        canEditEvents: true,
      },
      elevatedModRole: null,
      username: 'user-one',
      modProfileName: 'mod-one',
    });

    expect(permissions.canEditComments).toBe(true);
    expect(permissions.canEditDiscussions).toBe(false);
    expect(permissions.canEditEvents).toBe(true);
  });
});
