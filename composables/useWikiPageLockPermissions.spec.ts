import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { useWikiPageLockPermissions } from './useWikiPageLockPermissions';
import { useResolvedModPermissions } from '@/composables/useResolvedModPermissions';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({ serverConfigs: [{ id: 'server-1' }] }),
    loading: ref(false),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
  useModProfileName: () => ref('mod-alice'),
}));

const { mockUserPermissions } = vi.hoisted(() => ({
  mockUserPermissions: { value: { canDeleteWiki: false } as Record<string, boolean> },
}));

vi.mock('@/composables/useResolvedModPermissions', () => ({
  useResolvedModPermissions: vi.fn(() => ({
    userPermissions: mockUserPermissions,
  })),
}));

describe('useWikiPageLockPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserPermissions.value = { canDeleteWiki: false };
  });

  // The `channelData` handed to useResolvedModPermissions is the internal
  // `normalizedChannel` computed; capturing it lets us assert the normalization.
  const normalizedChannelOf = (channel: unknown) => {
    useWikiPageLockPermissions(computed(() => channel));
    const params = (useResolvedModPermissions as any).mock.calls[0][0];
    return params.channelData.value;
  };

  it('exposes canManageWikiPageLock from the resolved canDeleteWiki permission', () => {
    mockUserPermissions.value = { canDeleteWiki: true };
    const { canManageWikiPageLock } = useWikiPageLockPermissions(computed(() => ({})));
    expect(canManageWikiPageLock.value).toBe(true);
  });

  it('normalizes a null channel to null', () => {
    expect(normalizedChannelOf(null)).toBeNull();
  });

  it('filters out admins without a username', () => {
    const result = normalizedChannelOf({
      Admins: [{ username: 'bob' }, { username: '' }, { username: null }],
    });
    expect(result.Admins).toEqual([{ username: 'bob' }]);
  });

  it('filters out moderators without a displayName', () => {
    const result = normalizedChannelOf({
      Moderators: [{ displayName: 'modBob' }, { displayName: '' }],
    });
    expect(result.Moderators).toEqual([{ displayName: 'modBob' }]);
  });

  it('filters out suspended mods without a modProfileName', () => {
    const result = normalizedChannelOf({
      SuspendedMods: [{ modProfileName: 'susMod' }, { modProfileName: null }],
    });
    expect(result.SuspendedMods).toEqual([{ modProfileName: 'susMod' }]);
  });

  it('filters out suspended users without a username', () => {
    const result = normalizedChannelOf({
      SuspendedUsers: [{ username: 'susUser' }, { username: '' }],
    });
    expect(result.SuspendedUsers).toEqual([{ username: 'susUser' }]);
  });

  it('defaults missing role arrays to empty arrays', () => {
    const result = normalizedChannelOf({ uniqueName: 'forum-1' });
    expect({
      Admins: result.Admins,
      Moderators: result.Moderators,
      SuspendedMods: result.SuspendedMods,
      SuspendedUsers: result.SuspendedUsers,
    }).toEqual({ Admins: [], Moderators: [], SuspendedMods: [], SuspendedUsers: [] });
  });
});
