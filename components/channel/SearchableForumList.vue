<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import type { Channel } from '@/src/__generated__/graphql';
import { GET_CHANNEL_NAMES } from '@/graphQLData/channel/queries';
import SearchBar from '@/components/SearchBar.vue';
import type { PropType } from 'vue';

// Define props
const props = defineProps({
  hideSelected: {
    type: Boolean,
    default: false,
  },
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: 'Select your intended audience',
  },
});

// Emit function
const emit = defineEmits(['setChannelNames', 'toggleSelection']);

// Local state
const searchInput = ref<string>('');
const selected = ref([...props.selectedChannels]);

// Computed properties
const searchInputComputed = computed(() => `(?i).*${searchInput.value}.*`);

const { loading: channelsLoading, error: channelsError, result: channelsResult, onResult: onGetChannelNames } = useQuery(GET_CHANNEL_NAMES, {
  channelWhere: {
    uniqueName_MATCHES: searchInputComputed,
  },
});

const channelOptions = computed(() => {
  if (!channelsResult.value || !channelsResult.value.channels) {
    return [];
  }
  return channelsResult.value.channels.map((channel: Channel) => ({
    uniqueName: channel.uniqueName,
    displayName: channel.displayName,
    icon: channel.channelIconURL,
    description: channel.description,
  }));
});

// Watch the query result
onGetChannelNames(() => {
  const channels = channelsResult.value?.channels.map((channel: Channel) => ({
    uniqueName: channel.uniqueName,
    displayName: channel.displayName,
    icon: channel.channelIconURL,
    description: channel.description,
  }));
  emit('setChannelNames', channels);
});

watch(
  () => props.selectedChannels,
  (newVal) => {
    selected.value = [...newVal];
  }
);

const updateSearchResult = (input: string) => {
  searchInput.value = input;
};

const truncate = (description: string) => {
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
};
</script>

<template>
  <div
    class="absolute z-10 w-full rounded-md max-h-96 overflow-y-auto border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
  >
    <SearchBar
      class="w-full p-1 align-middle"
      :auto-focus="true"
      :search-placeholder="'Search forums'"
      :initial-value="searchInput"
      :right-side-is-rounded="false"
      :left-side-is-rounded="false"
      @keydown.enter.prevent
      @update-search-input="updateSearchResult"
    />
    <div v-if="channelsLoading">
      Loading...
    </div>
    <div v-else-if="channelsError">
      <div v-for="(error, i) of channelsError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <div
      v-for="channel in channelOptions"
      :key="channel.uniqueName"
      class="border-b p-1 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
    >
      <label class="flex cursor-pointer items-center space-x-3 p-2">
        <input
          type="checkbox"
          :value="channel.uniqueName"
          :checked="selected.includes(channel.uniqueName)"
          class="form-checkbox"
          @change="() => emit('toggleSelection', channel.uniqueName)"
        >
        <div class="flex items-center space-x-2">
          <Avatar
            v-if="channel.icon"
            class="z-10"
            :is-small="true"
            :text="channel.uniqueName"
            :src="channel.icon"
          />
          <Avatar
            v-else
            class="z-10"
            :is-small="true"
            :text="channel.uniqueName"
          />
          <div class="flex-col">
            <span v-if="!channel.displayName" class="font-mono font-bold">
              {{ channel.uniqueName }}
            </span>
            <div v-else>
              <span class="font-bold">{{ channel.displayName }}</span>
              &#8226;
              <span class="font-mono">{{ channel.uniqueName }}</span>
            </div>
            <div>{{ truncate(channel.description || "") }}</div>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>
