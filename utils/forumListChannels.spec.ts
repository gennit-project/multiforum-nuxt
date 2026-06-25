import { describe, it, expect } from 'vitest';
import {
  buildChannelCountMap,
  mergeChannelCounts,
  toggleSelectedTag,
} from './forumListChannels';

describe('buildChannelCountMap', () => {
  it('maps each channel name to its aggregate count', () => {
    const map = buildChannelCountMap([
      { uniqueName: 'cats', DiscussionChannelsAggregate: { count: 3 } },
      { uniqueName: 'dogs', DiscussionChannelsAggregate: { count: 5 } },
    ]);
    expect(map.get('dogs')).toBe(5);
  });

  it('defaults a missing aggregate to zero', () => {
    const map = buildChannelCountMap([{ uniqueName: 'cats' }]);
    expect(map.get('cats')).toBe(0);
  });

  it('skips channels without a unique name', () => {
    const map = buildChannelCountMap([
      { DiscussionChannelsAggregate: { count: 1 } },
    ]);
    expect(map.size).toBe(0);
  });
});

describe('mergeChannelCounts', () => {
  const baseChannels = [
    { uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } },
  ];

  it('injects the corrected discussion count from the map', () => {
    const merged = mergeChannelCounts({
      baseChannels,
      discussionCountMap: new Map([['cats', 7]]),
      downloadCountMap: new Map(),
    });
    expect(merged[0].DiscussionChannelsAggregate.count).toBe(7);
  });

  it('injects the download count from the map', () => {
    const merged = mergeChannelCounts({
      baseChannels,
      discussionCountMap: new Map(),
      downloadCountMap: new Map([['cats', 4]]),
    });
    expect(merged[0].downloadCount).toBe(4);
  });

  it('defaults both counts to zero when the channel is absent from the maps', () => {
    const merged = mergeChannelCounts({
      baseChannels,
      discussionCountMap: new Map(),
      downloadCountMap: new Map(),
    });
    expect([
      merged[0].DiscussionChannelsAggregate.count,
      merged[0].downloadCount,
    ]).toEqual([0, 0]);
  });

  it('returns an empty array for no base channels', () => {
    expect(
      mergeChannelCounts({
        baseChannels: null,
        discussionCountMap: new Map(),
        downloadCountMap: new Map(),
      })
    ).toEqual([]);
  });
});

describe('toggleSelectedTag', () => {
  it('adds a tag that is not selected', () => {
    expect(toggleSelectedTag(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a tag that is already selected', () => {
    expect(toggleSelectedTag(['a', 'b'], 'a')).toEqual(['b']);
  });
});
