import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { usernameVar, modProfileNameVar } from '@/cache';
import { useCommentPermissions } from './useCommentPermissions';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'testuser' },
  modProfileNameVar: { value: 'testmod' },
}));

vi.mock('@/config', () => ({
  config: { serverName: 'test-server' },
}));

describe('useCommentPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usernameVar.value = 'testuser';
    modProfileNameVar.value = 'testmod';
  });

  describe('when no data is loaded', () => {
    beforeEach(() => {
      (useQuery as any).mockReturnValue({
        result: ref(null),
        loading: ref(true),
      });
    });

    it('should set loading to true', () => {
      const forumId = ref('test-forum');
      const { loading } = useCommentPermissions(forumId);

      expect(loading.value).toBe(true);
    });

    it('should set canReport to false', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.canReport).toBe(false);
    });

    it('should set canGiveFeedback to false', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.canGiveFeedback).toBe(false);
    });

    it('should set isChannelOwner to false', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.isChannelOwner).toBe(false);
    });
  });

  describe('when user is channel admin', () => {
    beforeEach(() => {
      const channelQueryMock = {
        result: ref({
          channels: [
            {
              DefaultModRole: {
                canReport: true,
                canGiveFeedback: true,
                canHideComment: false,
              },
              ElevatedModRole: {
                canReport: true,
                canGiveFeedback: true,
                canHideComment: true,
              },
            },
          ],
        }),
        loading: ref(false),
      };

      const serverQueryMock = {
        result: ref({
          serverConfigs: [
            {
              DefaultModRole: {
                canReport: true,
                canGiveFeedback: false,
              },
              DefaultElevatedModRole: {
                canReport: true,
                canGiveFeedback: true,
              },
            },
          ],
        }),
        loading: ref(false),
      };

      const permissionQueryMock = {
        result: ref({
          channels: [
            {
              Admins: [{ username: 'testuser' }],
              Moderators: [],
              SuspendedMods: [],
              SuspendedUsers: [],
            },
          ],
        }),
        loading: ref(false),
      };

      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return channelQueryMock;
        if (callCount === 2) return serverQueryMock;
        return permissionQueryMock;
      });
    });

    it('should set isChannelOwner to true', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.isChannelOwner).toBe(true);
    });
  });

  describe('when channel has no mod roles', () => {
    beforeEach(() => {
      const channelQueryMock = {
        result: ref({
          channels: [
            {
              DefaultModRole: null,
              ElevatedModRole: null,
            },
          ],
        }),
        loading: ref(false),
      };

      const serverQueryMock = {
        result: ref({
          serverConfigs: [
            {
              DefaultModRole: {
                canReport: true,
                canGiveFeedback: true,
              },
              DefaultElevatedModRole: {
                canReport: true,
                canGiveFeedback: true,
                canHideComment: true,
              },
            },
          ],
        }),
        loading: ref(false),
      };

      const permissionQueryMock = {
        result: ref({
          channels: [
            {
              Admins: [],
              Moderators: [],
              SuspendedMods: [],
              SuspendedUsers: [],
            },
          ],
        }),
        loading: ref(false),
      };

      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return channelQueryMock;
        if (callCount === 2) return serverQueryMock;
        return permissionQueryMock;
      });
    });

    it('should use server default mod role for canReport', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.canReport).toBe(true);
    });

    it('should use server default mod role for canGiveFeedback', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.canGiveFeedback).toBe(true);
    });
  });

  describe('when user is elevated moderator', () => {
    beforeEach(() => {
      const channelQueryMock = {
        result: ref({
          channels: [
            {
              DefaultModRole: { canHideComment: false },
              ElevatedModRole: { canHideComment: true },
            },
          ],
        }),
        loading: ref(false),
      };

      const serverQueryMock = {
        result: ref({ serverConfigs: [] }),
        loading: ref(false),
      };

      const permissionQueryMock = {
        result: ref({
          channels: [
            {
              Admins: [],
              Moderators: [{ displayName: 'testmod' }],
              SuspendedMods: [],
              SuspendedUsers: [],
            },
          ],
        }),
        loading: ref(false),
      };

      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return channelQueryMock;
        if (callCount === 2) return serverQueryMock;
        return permissionQueryMock;
      });
    });

    it('should set isElevatedMod to true', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.isElevatedMod).toBe(true);
    });

    it('should grant canHideComment from elevated mod role', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.canHideComment).toBe(true);
    });
  });

  describe('when user is suspended moderator', () => {
    beforeEach(() => {
      const channelQueryMock = {
        result: ref({
          channels: [
            {
              DefaultModRole: { canReport: true },
              ElevatedModRole: { canReport: true },
            },
          ],
        }),
        loading: ref(false),
      };

      const serverQueryMock = {
        result: ref({ serverConfigs: [] }),
        loading: ref(false),
      };

      const permissionQueryMock = {
        result: ref({
          channels: [
            {
              Admins: [],
              Moderators: [],
              SuspendedMods: [{ modProfileName: 'testmod' }],
              SuspendedUsers: [],
            },
          ],
        }),
        loading: ref(false),
      };

      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return channelQueryMock;
        if (callCount === 2) return serverQueryMock;
        return permissionQueryMock;
      });
    });

    it('should set isSuspendedMod to true', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.isSuspendedMod).toBe(true);
    });

    it('should deny canReport for suspended mods', () => {
      const forumId = ref('test-forum');
      const { userPermissions } = useCommentPermissions(forumId);

      expect(userPermissions.value.canReport).toBe(false);
    });
  });
});
