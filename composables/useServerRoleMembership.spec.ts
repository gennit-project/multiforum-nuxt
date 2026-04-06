import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useServerRoleMembership } from './useServerRoleMembership';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/config', () => ({
  config: { serverName: 'test-server' },
}));

describe('useServerRoleMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns admin usernames from server config membership', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      result: ref({
        serverConfigs: [
          {
            Admins: [{ username: 'alice' }, { username: 'bob' }],
            Moderators: [],
          },
        ],
      }),
    });

    const { serverAdminUsernames } = useServerRoleMembership();

    expect(serverAdminUsernames.value).toEqual(['alice', 'bob']);
  });

  it('returns moderator usernames from server config membership', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      result: ref({
        serverConfigs: [
          {
            Admins: [],
            Moderators: [{ User: { username: 'alice' } }, { User: null }],
          },
        ],
      }),
    });

    const { serverModUsernames } = useServerRoleMembership();

    expect(serverModUsernames.value).toEqual(['alice']);
  });

  it('returns moderator display names from server config membership', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      result: ref({
        serverConfigs: [
          {
            Admins: [],
            Moderators: [
              { displayName: 'Mod Alice' },
              { displayName: null },
              { displayName: 'Mod Bob' },
            ],
          },
        ],
      }),
    });

    const { serverModProfileNames } = useServerRoleMembership();

    expect(serverModProfileNames.value).toEqual(['Mod Alice', 'Mod Bob']);
  });

  it('returns empty membership arrays when server config is missing', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      result: ref({
        serverConfigs: [],
      }),
    });

    const {
      serverAdminUsernames,
      serverModUsernames,
      serverModProfileNames,
    } = useServerRoleMembership();

    expect([
      serverAdminUsernames.value,
      serverModUsernames.value,
      serverModProfileNames.value,
    ]).toEqual([[], [], []]);
  });
});
