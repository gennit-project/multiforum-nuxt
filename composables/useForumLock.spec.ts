import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useForumLock, FORUM_LOCKED_MESSAGE } from '@/composables/useForumLock';
import { asMock, createQueryMock } from '@/tests/utils/mockApollo';

const h = vi.hoisted(() => ({
  username: null as unknown as ReturnType<typeof ref<string>>,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref: vueRef } = await import('vue');
  h.username = vueRef('');
  return {
    useUsername: () => h.username,
  };
});

const mockChannel = (channel: Record<string, unknown> | null) => {
  asMock(useQuery).mockReturnValue(
    createQueryMock(channel ? { channels: [channel] } : { channels: [] })
  );
};

describe('useForumLock', () => {
  beforeEach(() => {
    asMock(useQuery).mockReset();
    h.username.value = '';
  });

  it('uses the forum layout query variables so Apollo can reuse its result', () => {
    h.username.value = 'viewer';
    mockChannel({ locked: false });

    useForumLock(ref('cats'));

    const variables = asMock(useQuery).mock.calls[0]?.[1] as () => {
      uniqueName: string;
      loggedInUsername: string | null;
      now: string;
    };
    expect(variables()).toEqual({
      uniqueName: 'cats',
      loggedInUsername: 'viewer',
      now: expect.stringMatching(/Z$/),
    });
  });

  it('reports locked=true for a locked forum', () => {
    mockChannel({ locked: true, lockReason: 'Spam wave' });
    expect(useForumLock(ref('cats')).locked.value).toBe(true);
  });

  it('exposes the shared lock message when locked', () => {
    mockChannel({ locked: true, lockReason: 'Spam wave' });
    expect(useForumLock(ref('cats')).lockError.value).toBe(
      FORUM_LOCKED_MESSAGE
    );
  });

  it('surfaces the lock reason when locked', () => {
    mockChannel({ locked: true, lockReason: 'Spam wave' });
    expect(useForumLock(ref('cats')).lockReason.value).toBe('Spam wave');
  });

  it('reports locked=false for an unlocked forum', () => {
    mockChannel({ locked: false, lockReason: null });
    expect(useForumLock(ref('cats')).locked.value).toBe(false);
  });

  it('returns no lock error for an unlocked forum', () => {
    mockChannel({ locked: false, lockReason: null });
    expect(useForumLock(ref('cats')).lockError.value).toBe(null);
  });

  it('treats a missing channel as unlocked', () => {
    mockChannel(null);
    expect(useForumLock(ref('cats')).locked.value).toBe(false);
  });

  it('accepts a plain string channel id', () => {
    mockChannel({ locked: true });
    expect(useForumLock('cats').locked.value).toBe(true);
  });
});
