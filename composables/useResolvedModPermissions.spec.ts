import { computed, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { useResolvedModPermissions } from './useResolvedModPermissions';

describe('useResolvedModPermissions', () => {
  it('prefers the channel default mod role over the server default mod role', () => {
    const { userPermissions } = useResolvedModPermissions({
      channelData: ref({
        DefaultModRole: {
          canReport: false,
        },
      }),
      serverConfig: ref({
        DefaultModRole: {
          canReport: true,
        },
      }),
      permissionData: ref({
        Admins: [],
        Moderators: [],
        SuspendedMods: [],
        SuspendedUsers: [],
      }),
      username: computed(() => 'user'),
      modProfileName: computed(() => 'mod'),
    });

    expect(userPermissions.value.canReport).toBe(false);
  });

  it('falls back to the server elevated mod role when the channel role is missing', () => {
    const { userPermissions } = useResolvedModPermissions({
      channelData: ref({
        DefaultModRole: {
          canReport: true,
        },
        ElevatedModRole: null,
      }),
      serverConfig: ref({
        DefaultElevatedModRole: {
          canHideComment: true,
        },
      }),
      permissionData: ref({
        Admins: [],
        Moderators: [{ displayName: 'mod' }],
        SuspendedMods: [],
        SuspendedUsers: [],
      }),
      username: computed(() => 'user'),
      modProfileName: computed(() => 'mod'),
    });

    expect(userPermissions.value.canHideComment).toBe(true);
  });

  it('uses explicit permission data when it is provided', () => {
    const { userPermissions } = useResolvedModPermissions({
      channelData: ref({
        Admins: [],
      }),
      serverConfig: ref(null),
      permissionData: ref({
        Admins: [{ username: 'user' }],
      }),
      username: computed(() => 'user'),
      modProfileName: computed(() => 'mod'),
    });

    expect(userPermissions.value.isChannelOwner).toBe(true);
  });

  it('falls back to channel data when explicit permission data is not provided', () => {
    const { userPermissions } = useResolvedModPermissions({
      channelData: ref({
        Admins: [{ username: 'user' }],
      }),
      serverConfig: ref(null),
      username: computed(() => 'user'),
      modProfileName: computed(() => 'mod'),
    });

    expect(userPermissions.value.isChannelOwner).toBe(true);
  });
});
