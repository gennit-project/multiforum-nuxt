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

  it('returns the issue activity feed mutations and pagination API', () => {
    const activityFeed = useIssueActivityFeed({
      channelId: ref('general'),
    });

    expect(Object.keys(activityFeed).sort()).toEqual([
      'activityFeedItems',
      'addIssueActivityFeedItem',
      'addIssueActivityFeedItemWithCommentAsMod',
      'addIssueActivityFeedItemWithCommentAsModError',
      'addIssueActivityFeedItemWithCommentAsModLoading',
      'addIssueActivityFeedItemWithCommentAsUser',
      'addIssueActivityFeedItemWithCommentAsUserError',
      'addIssueActivityFeedItemWithCommentAsUserLoading',
      'hasMoreActivityFeed',
      'loadMoreActivityFeed',
      'resetActivityFeed',
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

const makeFeed = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `a${i}` }));

describe('useIssueActivityFeed — pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      loading: ref(false),
      error: ref(null),
    });
  });

  it('exposes the active issue activity feed items', () => {
    const { activityFeedItems } = useIssueActivityFeed({
      channelId: ref('general'),
      activeIssue: ref({ ActivityFeed: makeFeed(2) }) as never,
    });

    expect(activityFeedItems.value).toHaveLength(2);
  });

  it('has more feed when the last batch filled the page', () => {
    let resultCb: (r: unknown) => void = () => {};
    const { hasMoreActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      activityFeedLimit: 10,
      onIssueResult: (cb) => {
        resultCb = cb as (r: unknown) => void;
      },
    });

    resultCb({ data: { issues: [{ ActivityFeed: makeFeed(10) }] } });

    expect(hasMoreActivityFeed.value).toBe(true);
  });

  it('has no more feed when the last batch was short', () => {
    let resultCb: (r: unknown) => void = () => {};
    const { hasMoreActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      activityFeedLimit: 10,
      onIssueResult: (cb) => {
        resultCb = cb as (r: unknown) => void;
      },
    });

    resultCb({ data: { issues: [{ ActivityFeed: makeFeed(3) }] } });

    expect(hasMoreActivityFeed.value).toBe(false);
  });

  it('fetches more from the current offset', async () => {
    const fetchMoreIssue = vi
      .fn()
      .mockResolvedValue({ data: { issues: [{ ActivityFeed: makeFeed(15) }] } });
    const { loadMoreActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      activityFeedLimit: 10,
      issueNumber: ref(7),
      activeIssue: ref({ ActivityFeed: makeFeed(10) }) as never,
      getIssueLoading: ref(false),
      fetchMoreIssue,
    });

    await loadMoreActivityFeed();

    expect(fetchMoreIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          channelUniqueName: 'general',
          issueNumber: 7,
          activityFeedLimit: 10,
          activityFeedOffset: 10,
        },
      })
    );
  });

  it('does not fetch more while the issue query is loading', async () => {
    const fetchMoreIssue = vi.fn();
    const { loadMoreActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      getIssueLoading: ref(true),
      activeIssue: ref({ ActivityFeed: [] }) as never,
      fetchMoreIssue,
    });

    await loadMoreActivityFeed();

    expect(fetchMoreIssue).not.toHaveBeenCalled();
  });

  it('merges the newly fetched feed onto the previous results', async () => {
    const fetchMoreIssue = vi
      .fn()
      .mockResolvedValue({ data: { issues: [{ ActivityFeed: makeFeed(5) }] } });
    const { loadMoreActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      activityFeedLimit: 10,
      activeIssue: ref({ ActivityFeed: makeFeed(10) }) as never,
      getIssueLoading: ref(false),
      fetchMoreIssue,
    });
    await loadMoreActivityFeed();

    const updateQuery = fetchMoreIssue.mock.calls[0]![0].updateQuery;
    const merged = updateQuery(
      { issues: [{ id: 'i1', ActivityFeed: [{ id: 'old' }] }] },
      { fetchMoreResult: { issues: [{ id: 'i1', ActivityFeed: [{ id: 'new' }] }] } }
    );

    expect(merged.issues[0].ActivityFeed).toHaveLength(2);
  });

  it('keeps the previous results when fetchMore returns nothing', async () => {
    const fetchMoreIssue = vi
      .fn()
      .mockResolvedValue({ data: { issues: [{ ActivityFeed: makeFeed(5) }] } });
    const { loadMoreActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      activityFeedLimit: 10,
      activeIssue: ref({ ActivityFeed: makeFeed(10) }) as never,
      getIssueLoading: ref(false),
      fetchMoreIssue,
    });
    await loadMoreActivityFeed();

    const updateQuery = fetchMoreIssue.mock.calls[0]![0].updateQuery;
    const previous = { issues: [{ id: 'i1', ActivityFeed: [{ id: 'old' }] }] };

    expect(updateQuery(previous, { fetchMoreResult: null })).toBe(previous);
  });

  it('refetches the issue when the feed is reset', async () => {
    const refetchIssue = vi.fn().mockResolvedValue(undefined);
    const { resetActivityFeed } = useIssueActivityFeed({
      channelId: ref('general'),
      refetchIssue,
    });

    await resetActivityFeed();

    expect(refetchIssue).toHaveBeenCalledTimes(1);
  });
});
