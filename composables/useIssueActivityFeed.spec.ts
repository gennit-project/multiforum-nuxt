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
          { id: 'issue-1', ActivityFeed: [], ActivityFeedConnection: { aggregate: { count: { nodes: 0 } } } },
          { id: 'issue-2', ActivityFeed: [], ActivityFeedConnection: { aggregate: { count: { nodes: 0 } } } },
        ],
      })),
      writeQuery: vi.fn(),
    };

    firstOptions.update(cache, {
      data: {
        addIssueActivityFeedItem: {
          issues: [
            {
              id: 'issue-1',
              issueNumber: 1,
              channelUniqueName: 'general',
              ActivityFeed: [{ id: 'new-activity' }],
              ActivityFeedConnection: { aggregate: { count: { nodes: 1 } } },
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
              ActivityFeed: [{ id: 'new-activity' }],
              ActivityFeedConnection: { aggregate: { count: { nodes: 1 } } },
            },
            { id: 'issue-2', ActivityFeed: [], ActivityFeedConnection: { aggregate: { count: { nodes: 0 } } } },
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

    firstOptions.update(cache, { data: { addIssueActivityFeedItem: { issues: [] } } });

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
        return { off: vi.fn() };
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
        return { off: vi.fn() };
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
  it('rejects a page after the forum changes', async () => {
    const channelId = ref('cats');
    const fetchMoreIssue = vi.fn().mockResolvedValue({ data: { issues: [] } });
    const { loadMoreActivityFeed } = useIssueActivityFeed({ channelId, issueNumber: ref(1), fetchMoreIssue });
    await loadMoreActivityFeed();
    channelId.value = 'dogs';
    const previous = { issues: [{ id: 'i1', ActivityFeed: [{ id: 'old' }] }] };
    expect(fetchMoreIssue.mock.calls[0]![0].updateQuery(previous, { fetchMoreResult: { issues: [{ id: 'i1', ActivityFeed: [{ id: 'new' }] }] } })).toBe(previous);
  });

  it('deduplicates repeated overlapping activity pages', async () => {
    const fetchMoreIssue = vi.fn().mockResolvedValue({ data: { issues: [] } });
    const { loadMoreActivityFeed } = useIssueActivityFeed({ channelId: ref('cats'), issueNumber: ref(1), fetchMoreIssue });
    await loadMoreActivityFeed();
    const previous = { issues: [{ id: 'i1', ActivityFeed: [{ id: 'old' }] }] };
    const next = { issues: [{ id: 'i1', ActivityFeed: [{ id: 'old' }, { id: 'new' }] }] };
    const merge = fetchMoreIssue.mock.calls[0]![0].updateQuery;
    const first = merge(previous, { fetchMoreResult: next });
    expect(merge(first, { fetchMoreResult: next }).issues[0].ActivityFeed).toEqual([{ id: 'old' }, { id: 'new' }]);
  });

});
