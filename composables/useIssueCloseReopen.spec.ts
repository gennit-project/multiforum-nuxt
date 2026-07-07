import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useIssueCloseReopen } from './useIssueCloseReopen';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

const mockedUseMutation = () =>
  useMutation as unknown as ReturnType<typeof vi.fn>;

describe('useIssueCloseReopen', () => {
  const closeIssue = vi.fn();
  const reopenIssue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseMutation()
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
      channelId: ref('general'),
    });

    expect({
      closeIssue: issueActions.closeIssue,
      reopenIssue: issueActions.reopenIssue,
      mutationCalls: mockedUseMutation().mock.calls.length,
    }).toEqual({
      closeIssue,
      reopenIssue,
      mutationCalls: 2,
    });
  });

  it('close updater flips isOpen and adjusts the open/closed counts', () => {
    useIssueCloseReopen({
      activeIssueId: ref('issue-1'),
      channelId: ref('general'),
    });
    const closeOptions = mockedUseMutation().mock.calls[0]![1]();
    const cache = {
      identify: vi.fn(() => 'Issue:issue-1'),
      modify: vi.fn(),
      readQuery: vi
        .fn()
        .mockReturnValueOnce({ issuesAggregate: { count: 3 } })
        .mockReturnValueOnce({ issuesAggregate: { count: 7 } }),
      writeQuery: vi.fn(),
    };

    closeOptions.update(cache);

    expect({
      modifiedId: cache.modify.mock.calls[0]![0].id,
      isOpenAfter: cache.modify.mock.calls[0]![0].fields.isOpen(),
      writeData: cache.writeQuery.mock.calls.map((call) => call[0].data),
    }).toEqual({
      modifiedId: 'Issue:issue-1',
      isOpenAfter: false,
      writeData: [
        { issuesAggregate: { count: 4 } },
        { issuesAggregate: { count: 6 } },
      ],
    });
  });

  it('reopen updater flips isOpen and adjusts the open/closed counts', () => {
    useIssueCloseReopen({
      activeIssueId: ref('issue-1'),
      channelId: ref('general'),
    });
    const reopenOptions = mockedUseMutation().mock.calls[1]![1]();
    const cache = {
      identify: vi.fn(() => 'Issue:issue-1'),
      modify: vi.fn(),
      readQuery: vi
        .fn()
        .mockReturnValueOnce({ issuesAggregate: { count: 3 } })
        .mockReturnValueOnce({ issuesAggregate: { count: 7 } }),
      writeQuery: vi.fn(),
    };

    reopenOptions.update(cache);

    expect({
      modifiedId: cache.modify.mock.calls[0]![0].id,
      isOpenAfter: cache.modify.mock.calls[0]![0].fields.isOpen(),
      writeData: cache.writeQuery.mock.calls.map((call) => call[0].data),
    }).toEqual({
      modifiedId: 'Issue:issue-1',
      isOpenAfter: true,
      writeData: [
        { issuesAggregate: { count: 2 } },
        { issuesAggregate: { count: 8 } },
      ],
    });
  });
});
