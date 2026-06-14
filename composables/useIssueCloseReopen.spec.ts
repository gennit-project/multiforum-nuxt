import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useIssueCloseReopen } from './useIssueCloseReopen';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

describe('useIssueCloseReopen', () => {
  const closeIssue = vi.fn();
  const reopenIssue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        mutate: closeIssue,
        loading: ref(false),
      })
      .mockReturnValueOnce({
        mutate: reopenIssue,
        loading: ref(false),
      });
  });

  it('returns close and reopen mutation handlers', () => {
    const issueActions = useIssueCloseReopen({
      activeIssueId: ref('issue-1'),
      activeIssue: ref({ id: 'issue-1', issueNumber: 1 } as any),
      channelId: ref('general'),
    });

    expect({
      closeIssue: issueActions.closeIssue,
      reopenIssue: issueActions.reopenIssue,
      mutationCalls: (useMutation as unknown as ReturnType<typeof vi.fn>).mock
        .calls.length,
    }).toEqual({
      closeIssue,
      reopenIssue,
      mutationCalls: 2,
    });
  });

  it('close updater moves the issue from open to closed cache data', () => {
    const activeIssue = { id: 'issue-1', issueNumber: 1, body: 'Issue body' };
    useIssueCloseReopen({
      activeIssueId: ref('issue-1'),
      activeIssue: ref(activeIssue as any),
      channelId: ref('general'),
    });
    const closeOptionsFactory = (useMutation as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0]![1];
    const closeOptions = closeOptionsFactory();
    const cache = {
      identify: vi.fn(() => 'Issue:issue-1'),
      modify: vi.fn(),
      readQuery: vi
        .fn()
        .mockReturnValueOnce({ issuesAggregate: { count: 3 } })
        .mockReturnValueOnce({ issuesAggregate: { count: 7 } })
        .mockReturnValueOnce({
          channels: [
            {
              uniqueName: 'general',
              Issues: [
                activeIssue,
                { id: 'issue-2', issueNumber: 2 },
              ],
            },
          ],
        })
        .mockReturnValueOnce({
          channels: [{ uniqueName: 'general', Issues: [] }],
        }),
      writeQuery: vi.fn(),
    };

    closeOptions.update(cache);

    expect({
      modifiedId: cache.modify.mock.calls[0]![0].id,
      writeData: cache.writeQuery.mock.calls.map((call) => call[0].data),
    }).toEqual({
      modifiedId: 'Issue:issue-1',
      writeData: [
        { issuesAggregate: { count: 4 } },
        { issuesAggregate: { count: 6 } },
        {
          channels: [
            {
              uniqueName: 'general',
              Issues: [{ id: 'issue-2', issueNumber: 2 }],
            },
          ],
        },
        {
          channels: [
            {
              uniqueName: 'general',
              Issues: [activeIssue],
            },
          ],
        },
      ],
    });
  });

  it('reopen updater moves the issue from closed to open cache data', () => {
    const activeIssue = { id: 'issue-1', issueNumber: 1, body: 'Issue body' };
    useIssueCloseReopen({
      activeIssueId: ref('issue-1'),
      activeIssue: ref(activeIssue as any),
      channelId: ref('general'),
    });
    const reopenOptionsFactory = (useMutation as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[1]![1];
    const reopenOptions = reopenOptionsFactory();
    const cache = {
      identify: vi.fn(() => 'Issue:issue-1'),
      modify: vi.fn(),
      readQuery: vi
        .fn()
        .mockReturnValueOnce({ issuesAggregate: { count: 3 } })
        .mockReturnValueOnce({ issuesAggregate: { count: 7 } })
        .mockReturnValueOnce({
          channels: [
            {
              uniqueName: 'general',
              Issues: [
                activeIssue,
                { id: 'issue-2', issueNumber: 2 },
              ],
            },
          ],
        })
        .mockReturnValueOnce({
          channels: [{ uniqueName: 'general', Issues: [] }],
        }),
      writeQuery: vi.fn(),
    };

    reopenOptions.update(cache);

    expect({
      modifiedId: cache.modify.mock.calls[0]![0].id,
      writeData: cache.writeQuery.mock.calls.map((call) => call[0].data),
    }).toEqual({
      modifiedId: 'Issue:issue-1',
      writeData: [
        { issuesAggregate: { count: 2 } },
        { issuesAggregate: { count: 8 } },
        {
          channels: [
            {
              uniqueName: 'general',
              Issues: [{ id: 'issue-2', issueNumber: 2 }],
            },
          ],
        },
        {
          channels: [
            {
              uniqueName: 'general',
              Issues: [activeIssue],
            },
          ],
        },
      ],
    });
  });
});
