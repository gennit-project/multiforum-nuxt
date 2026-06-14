import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useIssueActivityFeed } from './useIssueActivityFeed';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

describe('useIssueActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      loading: ref(false),
      error: ref(null),
    });
  });

  it('returns all issue activity feed mutations', () => {
    const activityFeed = useIssueActivityFeed({
      channelId: ref('general'),
    });

    expect(Object.keys(activityFeed).sort()).toEqual([
      'addIssueActivityFeedItem',
      'addIssueActivityFeedItemWithCommentAsMod',
      'addIssueActivityFeedItemWithCommentAsModError',
      'addIssueActivityFeedItemWithCommentAsModLoading',
      'addIssueActivityFeedItemWithCommentAsUser',
      'addIssueActivityFeedItemWithCommentAsUserError',
      'addIssueActivityFeedItemWithCommentAsUserLoading',
    ]);
  });

  it('updates a cached issue when mutation data contains an updated issue', () => {
    useIssueActivityFeed({
      channelId: ref('general'),
      activityFeedLimit: 20,
    });
    const firstOptions = (useMutation as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![1];
    const cache = {
      readQuery: vi.fn(() => ({
        issues: [
          { id: 'issue-1', issueNumber: 1, body: 'Original' },
          { id: 'issue-2', issueNumber: 2, body: 'Other' },
        ],
      })),
      writeQuery: vi.fn(),
    };

    firstOptions.update(cache, {
      data: {
        updateIssues: {
          issues: [
            {
              id: 'issue-1',
              issueNumber: 1,
              channelUniqueName: 'general',
              body: 'Updated',
            },
          ],
        },
      },
    });

    expect(cache.writeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          channelUniqueName: 'general',
          issueNumber: 1,
          activityFeedLimit: 20,
          activityFeedOffset: 0,
        },
        data: {
          issues: [
            {
              id: 'issue-1',
              issueNumber: 1,
              channelUniqueName: 'general',
              body: 'Updated',
            },
            { id: 'issue-2', issueNumber: 2, body: 'Other' },
          ],
        },
      })
    );
  });

  it('skips cache writes when mutation data has no updated issues', () => {
    useIssueActivityFeed({
      channelId: ref('general'),
    });
    const firstOptions = (useMutation as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]![1];
    const cache = {
      readQuery: vi.fn(),
      writeQuery: vi.fn(),
    };

    firstOptions.update(cache, { data: { updateIssues: { issues: [] } } });

    expect(cache.writeQuery).not.toHaveBeenCalled();
  });
});
