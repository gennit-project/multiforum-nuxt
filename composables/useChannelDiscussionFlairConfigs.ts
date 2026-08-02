import { computed, ref, watch, type Ref } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import { GET_CHANNEL_DISCUSSION_FLAIR_CONFIG } from '@/graphQLData/channel/queries';
import type { DiscussionFlairOption } from '@/components/discussion/form/DiscussionFlairPicker.vue';

export type ChannelDiscussionFlairConfig = {
  channelUniqueName: string;
  flairRequired: boolean;
  flairs: DiscussionFlairOption[];
};

type FlairConfigQueryResult = {
  getChannelDiscussionFlairConfig?: ChannelDiscussionFlairConfig;
};

export const useChannelDiscussionFlairConfigs = (
  channelNames: Ref<string[]>
) => {
  const { resolveClient } = useApolloClient();
  const configsByChannel = ref<Record<string, ChannelDiscussionFlairConfig>>(
    {}
  );
  const errorsByChannel = ref<Record<string, string>>({});
  const loadingChannelSet = ref(new Set<string>());
  const requestedChannels = new Set<string>();

  const loadConfig = async (channelUniqueName: string) => {
    requestedChannels.add(channelUniqueName);
    loadingChannelSet.value = new Set([
      ...loadingChannelSet.value,
      channelUniqueName,
    ]);
    try {
      const response = await resolveClient().query<FlairConfigQueryResult>({
        query: GET_CHANNEL_DISCUSSION_FLAIR_CONFIG,
        variables: { channelUniqueName, includeArchived: false },
        fetchPolicy: 'cache-first',
      });
      const config = response.data?.getChannelDiscussionFlairConfig;
      if (!config) {
        throw new Error('The forum did not return a flair configuration.');
      }
      if (channelNames.value.includes(channelUniqueName)) {
        configsByChannel.value = {
          ...configsByChannel.value,
          [channelUniqueName]: config,
        };
        errorsByChannel.value = Object.fromEntries(
          Object.entries(errorsByChannel.value).filter(
            ([channel]) => channel !== channelUniqueName
          )
        );
      }
    } catch (error: unknown) {
      if (channelNames.value.includes(channelUniqueName)) {
        errorsByChannel.value = {
          ...errorsByChannel.value,
          [channelUniqueName]:
            error instanceof Error ? error.message : String(error),
        };
      }
    } finally {
      requestedChannels.delete(channelUniqueName);
      const nextLoading = new Set(loadingChannelSet.value);
      nextLoading.delete(channelUniqueName);
      loadingChannelSet.value = nextLoading;
    }
  };

  watch(
    channelNames,
    (nextChannels) => {
      const selected = new Set(nextChannels);
      configsByChannel.value = Object.fromEntries(
        Object.entries(configsByChannel.value).filter(([channel]) =>
          selected.has(channel)
        )
      );
      errorsByChannel.value = Object.fromEntries(
        Object.entries(errorsByChannel.value).filter(([channel]) =>
          selected.has(channel)
        )
      );
      loadingChannelSet.value = new Set(
        [...loadingChannelSet.value].filter((channel) => selected.has(channel))
      );

      for (const channel of nextChannels) {
        if (requestedChannels.has(channel)) {
          loadingChannelSet.value = new Set([
            ...loadingChannelSet.value,
            channel,
          ]);
          continue;
        }
        if (
          !configsByChannel.value[channel] &&
          !errorsByChannel.value[channel]
        ) {
          void loadConfig(channel);
        }
      }
    },
    { immediate: true }
  );

  const configs = computed(() =>
    channelNames.value
      .map((channel) => configsByChannel.value[channel])
      .filter((config): config is ChannelDiscussionFlairConfig => Boolean(config))
  );
  const loadingChannels = computed(() => [...loadingChannelSet.value]);

  return { configs, configsByChannel, loadingChannels, errorsByChannel };
};
