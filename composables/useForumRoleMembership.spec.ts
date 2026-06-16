import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useQuery } from '@vue/apollo-composable';
import {
  createForumRoleMembership,
  provideForumRoleMembership,
  useForumRoleMembership,
} from './useForumRoleMembership';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockQueryResult = (data: unknown) => {
  (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    result: ref(data),
  });
};

describe('useForumRoleMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createForumRoleMembership', () => {
    it('maps admin usernames from the channel', () => {
      mockQueryResult({
        channels: [
          {
            Admins: [{ username: 'alice' }, { username: 'bob' }],
            Moderators: [],
          },
        ],
      });

      const { forumAdminUsernames } = createForumRoleMembership('forum');

      expect(forumAdminUsernames.value).toEqual(['alice', 'bob']);
    });

    it('maps moderator usernames and drops moderators without a user', () => {
      mockQueryResult({
        channels: [
          {
            Admins: [],
            Moderators: [{ User: { username: 'alice' } }, { User: null }],
          },
        ],
      });

      const { forumModUsernames } = createForumRoleMembership('forum');

      expect(forumModUsernames.value).toEqual(['alice']);
    });

    it('maps moderator display names and drops empty ones', () => {
      mockQueryResult({
        channels: [
          {
            Admins: [],
            Moderators: [
              { displayName: 'Mod Alice' },
              { displayName: null },
              { displayName: 'Mod Bob' },
            ],
          },
        ],
      });

      const { forumModProfileNames } = createForumRoleMembership('forum');

      expect(forumModProfileNames.value).toEqual(['Mod Alice', 'Mod Bob']);
    });

    it('returns empty arrays when the channel is missing', () => {
      mockQueryResult({ channels: [] });

      const {
        forumAdminUsernames,
        forumModUsernames,
        forumModProfileNames,
      } = createForumRoleMembership('forum');

      expect([
        forumAdminUsernames.value,
        forumModUsernames.value,
        forumModProfileNames.value,
      ]).toEqual([[], [], []]);
    });

    it('accepts a ref for the channel name', () => {
      mockQueryResult({
        channels: [{ Admins: [{ username: 'alice' }], Moderators: [] }],
      });

      const { forumAdminUsernames } = createForumRoleMembership(ref('forum'));

      expect(forumAdminUsernames.value).toEqual(['alice']);
    });
  });

  describe('provide/inject', () => {
    it('exposes the provided membership to descendants', () => {
      mockQueryResult({
        channels: [{ Admins: [{ username: 'alice' }], Moderators: [] }],
      });

      const Child = defineComponent({
        setup() {
          const { forumAdminUsernames } = useForumRoleMembership();
          return { forumAdminUsernames };
        },
        template: '<div class="admins">{{ forumAdminUsernames.join(",") }}</div>',
      });

      const Parent = defineComponent({
        components: { Child },
        setup() {
          provideForumRoleMembership('forum');
        },
        template: '<Child />',
      });

      const wrapper = mount(Parent);

      expect(wrapper.find('.admins').text()).toBe('alice');
    });

    it('falls back to empty membership when no provider exists', () => {
      const Standalone = defineComponent({
        setup() {
          const { forumAdminUsernames } = useForumRoleMembership();
          return { forumAdminUsernames };
        },
        template: '<div class="admins">{{ forumAdminUsernames.length }}</div>',
      });

      const wrapper = mount(Standalone);

      expect(wrapper.find('.admins').text()).toBe('0');
    });
  });
});
