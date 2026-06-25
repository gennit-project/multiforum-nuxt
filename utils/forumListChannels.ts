/**
 * Pure helpers for the forum list page: building per-channel count maps from a
 * query result and merging the discussion/download counts onto the base channel
 * list. Extracted from forums/index.vue so the merge logic is unit-testable.
 */

type ChannelCountLike = {
  uniqueName?: string | null;
  DiscussionChannelsAggregate?: { count?: number | null } | null;
};

/**
 * Map of channel uniqueName -> aggregate count, read from a channels list (the
 * same `DiscussionChannelsAggregate.count` field is reused for download counts
 * in the downloads query).
 */
export function buildChannelCountMap(
  channels: ChannelCountLike[] | null | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const channel of channels || []) {
    if (channel.uniqueName) {
      map.set(channel.uniqueName, channel.DiscussionChannelsAggregate?.count || 0);
    }
  }
  return map;
}

export type MergeChannelCountsParams<T extends ChannelCountLike> = {
  baseChannels: T[] | null | undefined;
  discussionCountMap: Map<string, number>;
  downloadCountMap: Map<string, number>;
};

/**
 * Inject the discussion count (corrected from the dedicated query) and the
 * download count onto each base channel.
 */
export function mergeChannelCounts<T extends ChannelCountLike>(
  params: MergeChannelCountsParams<T>
): Array<T & { downloadCount: number }> {
  const { baseChannels, discussionCountMap, downloadCountMap } = params;
  return (baseChannels || []).map((channel) => {
    const key = channel.uniqueName ?? '';
    return {
      ...channel,
      DiscussionChannelsAggregate: {
        ...channel.DiscussionChannelsAggregate,
        count: discussionCountMap.get(key) || 0,
      },
      downloadCount: downloadCountMap.get(key) || 0,
    };
  });
}

/** Toggle a tag in the selected-tags list (pure: returns a new array). */
export function toggleSelectedTag(tags: string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}
