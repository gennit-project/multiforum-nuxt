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

  it('disables mod actions when the mod is suspended', () => {
    const permissions = getAllPermissions({
      permissionData: {
        Moderators: [{ displayName: 'mod-one' }],
        SuspendedMods: [{ modProfileName: 'mod-one' }],
      },
      standardModRole: {
        canReport: true,
        canGiveFeedback: true,
      },
      elevatedModRole: {
        canReport: true,
        canGiveFeedback: true,
      },
      username: 'user-one',
      modProfileName: 'mod-one',
    });

    expect(permissions.isSuspendedMod).toBe(true);
    expect(permissions.canReport).toBe(false);
    expect(permissions.canGiveFeedback).toBe(false);
  });

  it('marks the user as suspended when they appear in SuspendedUsers', () => {
    const permissions = getAllPermissions({
      permissionData: {
        SuspendedUsers: [{ username: 'user-one' }],
      },
      standardModRole: {
        canReport: true,
      },
      elevatedModRole: null,
      username: 'user-one',
      modProfileName: 'mod-one',
    });

    expect(permissions.isSuspendedUser).toBe(true);
  });

  it('disables report permission when the user is suspended', () => {
    const permissions = getAllPermissions({
      permissionData: {
        SuspendedUsers: [{ username: 'user-one' }],
      },
      standardModRole: {
        canReport: true,
      },
      elevatedModRole: null,
      username: 'user-one',
      modProfileName: 'mod-one',
    });

    expect(permissions.canReport).toBe(false);
  });

  it('marks the mod profile as suspended when it appears in SuspendedMods', () => {
    const permissions = getAllPermissions({
      permissionData: {
        SuspendedMods: [{ modProfileName: 'mod-one' }],
      },
      standardModRole: {
        canReport: true,
      },
      elevatedModRole: {
        canReport: true,
      },
      username: 'user-one',
      modProfileName: 'mod-one',
    });

    expect(permissions.isSuspendedMod).toBe(true);
  });
});
