import { computed } from 'vue';
import { useRoute } from 'nuxt/app';

export const useSelectedChannelsFromQuery = () => {
  const route = useRoute();

  const selectedChannels = computed<string[]>(() => {
    const channels = route.query.channels;
    if (typeof channels === 'string') {
      return channels ? [channels] : [];
    }
    if (Array.isArray(channels)) {
      return channels.filter(
        (value): value is string => typeof value === 'string' && !!value
      );
    }
    return [];
  });

  const hasSelectedChannels = computed(() => selectedChannels.value.length > 0);

  return {
    selectedChannels,
    hasSelectedChannels,
  };
};
