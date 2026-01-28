import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { usernameVar } from '@/cache';
import {
  useChannelSuspensionNotice,
  useServerSuspensionNotice,
} from '@/composables/useSuspensionNotice';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

describe('useSuspensionNotice', () => {
  beforeEach(() => {
    (useQuery as any).mockReset();
    usernameVar.value = 'alice';
  });

  it('maps channel-level suspension details', () => {
    (useQuery as any).mockReturnValue({
      result: ref({
        channels: [
          {
            SuspendedUsers: [
              {
                suspendedUntil: '2030-02-01T00:00:00.000Z',
                suspendedIndefinitely: false,
                RelatedIssue: { issueNumber: 12 },
              },
            ],
          },
        ],
      }),
    });

    const channelId = ref('cats');
    const {
      issueNumber,
      suspendedUntil,
      suspendedIndefinitely,
      channelId: resolvedChannelId,
    } = useChannelSuspensionNotice(channelId);

    expect(issueNumber.value).toBe(12);
    expect(suspendedUntil.value).toBe('2030-02-01T00:00:00.000Z');
    expect(suspendedIndefinitely.value).toBe(false);
    expect(resolvedChannelId.value).toBe('cats');
  });

  it('maps server-level suspension details', () => {
    (useQuery as any).mockReturnValue({
      result: ref({
        users: [
          {
            Suspensions: [
              {
                channelUniqueName: 'dogs',
                suspendedIndefinitely: true,
                suspendedUntil: null,
                RelatedIssue: { issueNumber: 77 },
              },
            ],
          },
        ],
      }),
    });

    const {
      issueNumber,
      suspendedIndefinitely,
      suspendedUntil,
      channelId,
    } = useServerSuspensionNotice();

    expect(issueNumber.value).toBe(77);
    expect(suspendedIndefinitely.value).toBe(true);
    expect(suspendedUntil.value).toBe(null);
    expect(channelId.value).toBe('dogs');
  });
});
