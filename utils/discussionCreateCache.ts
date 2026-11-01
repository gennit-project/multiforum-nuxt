import type { ApolloCache, Reference } from '@apollo/client/core';
import type { CreateDiscussionMutation } from '@/__generated__/operations';

export function appendCreatedDiscussion(
  cache: ApolloCache<unknown>,
  data: CreateDiscussionMutation | null | undefined
) {
  const created = data?.createDiscussionWithChannelConnections || [];
  const channels = created.flatMap(
    (discussion) => discussion.DiscussionChannels
  );
  cache.modify({
    fields: {
      getDiscussionsInChannel(
        existing,
        { storeFieldName, readField, toReference }
      ) {
        if (!existing) return existing;
        const prefix = 'getDiscussionsInChannel(';
        if (!storeFieldName.startsWith(prefix)) return existing;
        let args: unknown;
        try {
          args = JSON.parse(storeFieldName.slice(prefix.length, -1));
        } catch {
          return existing;
        }
        if (!args || typeof args !== 'object' || !('channelUniqueName' in args))
          return existing;
        const channelUniqueName = args.channelUniqueName;
        const matching = channels.filter(
          (channel) => channel.channelUniqueName === channelUniqueName
        );
        if (!matching.length) return existing;
        // Only update an unfiltered first page. Other cached scopes retain
        // their own membership/count semantics and refresh when requested.
        if ('showArchived' in args && args.showArchived) return existing;
        if ('hasDownload' in args && args.hasDownload) return existing;
        if (
          'labelFilters' in args &&
          Array.isArray(args.labelFilters) &&
          args.labelFilters.length
        )
          return existing;
        if ('searchInput' in args && args.searchInput) return existing;
        if (
          'selectedTags' in args &&
          Array.isArray(args.selectedTags) &&
          args.selectedTags.length
        )
          return existing;
        if (
          'options' in args &&
          args.options &&
          typeof args.options === 'object' &&
          'offset' in args.options &&
          args.options.offset
        )
          return existing;
        const previous = existing.discussionChannels || [];
        const fresh = matching.filter(
          (channel) =>
            !previous.some(
              (ref: Reference) => readField('id', ref) === channel.id
            )
        );
        if (!fresh.length) return existing;
        return {
          ...existing,
          discussionChannels: [
            ...fresh
              .map((channel) =>
                toReference({ __typename: 'DiscussionChannel', id: channel.id })
              )
              .filter((ref): ref is Reference => !!ref),
            ...previous,
          ],
          aggregateDiscussionChannelsCount:
            (existing.aggregateDiscussionChannelsCount || 0) + fresh.length,
        };
      },
    },
  });
}
