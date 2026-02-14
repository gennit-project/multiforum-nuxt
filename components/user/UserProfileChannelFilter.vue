<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import { updateFilters } from '@/utils/routerUtils';
import { getChannelLabel } from '@/utils';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';

const route = useRoute();
const router = useRouter();
const { selectedChannels } = useSelectedChannelsFromQuery();

const channelLabel = computed(() => getChannelLabel(selectedChannels.value));

const toggleSelectedChannel = (channel: string) => {
  const nextChannels = [...selectedChannels.value];
  const selectedIndex = nextChannels.indexOf(channel);

  if (selectedIndex >= 0) {
    nextChannels.splice(selectedIndex, 1);
  } else {
    nextChannels.push(channel);
  }

  updateFilters({
    router,
    route,
    params: {
      channels: nextChannels,
    },
  });
};
</script>

<template>
  <div class="flex items-center py-2">
    <FilterChip
      class="align-middle"
      :data-testid="'profile-forum-filter-button'"
      :label="channelLabel"
      :highlighted="selectedChannels.length > 0"
    >
      <template #icon>
        <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
      </template>
      <template #content>
        <div class="relative w-96">
          <SearchableForumList
            :selected-channels="selectedChannels"
            @toggle-selection="toggleSelectedChannel"
          />
        </div>
      </template>
    </FilterChip>
  </div>
</template>
