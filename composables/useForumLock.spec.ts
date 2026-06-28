import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useForumLock, FORUM_LOCKED_MESSAGE } from '@/composables/useForumLock';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockChannel = (channel: Record<string, unknown> | null) => {
  (useQuery as any).mockReturnValue({
    result: ref(channel ? { channels: [channel] } : { channels: [] }),
  });
};

describe('useForumLock', () => {
  beforeEach(() => {
    (useQuery as any).mockReset();
  });

  it('reports locked=true for a locked forum', () => {
    mockChannel({ locked: true, lockReason: 'Spam wave' });
    expect(useForumLock(ref('cats')).locked.value).toBe(true);
  });

  it('exposes the shared lock message when locked', () => {
    mockChannel({ locked: true, lockReason: 'Spam wave' });
    expect(useForumLock(ref('cats')).lockError.value).toBe(FORUM_LOCKED_MESSAGE);
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
