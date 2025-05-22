<script lang="ts" setup>
  import { ref, computed, watch } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import type { Channel } from "@/__generated__/graphql";
  import { GET_CHANNEL_NAMES } from "@/graphQLData/channel/queries";
  import SearchBar from "@/components/SearchBar.vue";
  import type { PropType } from "vue";
  import SearchableForumListItem from "./SearchableForumListItem.vue";

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
      default: "Select forums to submit to",
    },
    featuredForums: {
      type: Array as PropType<ChannelOption[]>,
      default: () => [],
    },
  });

  type ChannelOption = {
    uniqueName: string;
    displayName: string;
    icon: string;
    description: string;
  };

  const emit = defineEmits(["setChannelNames", "toggleSelection"]);
  const searchInput = ref<string>("");
  const selected = ref([...props.selectedChannels]);
  const searchInputComputed = computed(() => `(?i).*${searchInput.value}.*`);

  const {
    loading: channelsLoading,
    error: channelsError,
    result: channelsResult,
    onResult: onGetChannelNames,
  } = useQuery(GET_CHANNEL_NAMES, {
    channelWhere: {
      uniqueName_MATCHES: searchInputComputed,
    },
  });

  // Separate featured and regular channels
  const featuredChannels = computed(() => {
    return props.featuredForums
      .filter((channelOption: ChannelOption) => {
        return props.featuredForums.some(
          (featuredChannel) => featuredChannel.uniqueName === channelOption.uniqueName
        );
      })
      .sort(
        (a, b) =>
          props.featuredForums.findIndex((channel) => channel.uniqueName === a.uniqueName) -
          props.featuredForums.findIndex((channel) => channel.uniqueName === b.uniqueName)
      );
  });

  const regularChannels = computed(() => {
    return channelsResult.value?.channels
      .filter((channel: Channel) => {
        return !props.featuredForums.some(
          (featuredChannel) => featuredChannel.uniqueName === channel.uniqueName
        );
      })
      .sort((a: ChannelOption, b: ChannelOption) => {
        return a.uniqueName.localeCompare(b.uniqueName);
      });
  });

  // Watch the query result
  onGetChannelNames(() => {
    const channels = channelsResult.value?.channels.map((channel: Channel) => ({
      uniqueName: channel.uniqueName,
      displayName: channel.displayName,
      icon: channel.channelIconURL,
      description: channel.description,
    }));
    emit("setChannelNames", channels);
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
</script>

<template>
  <div
    class="touch-scroll-y absolute left-0 right-0 top-full z-50 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
  >
    <SearchBar
      :auto-focus="true"
      class="w-full align-middle"
      :initial-value="searchInput"
      :left-side-is-rounded="false"
      :right-side-is-rounded="false"
      :search-placeholder="'Search forums'"
      @keydown.enter.prevent
      @update-search-input="updateSearchResult"
    />
    <div v-if="channelsLoading">Loading...</div>
    <div v-else-if="channelsError">
      <div
        v-for="(error, i) of channelsError?.graphQLErrors"
        :key="i"
      >
        {{ error.message }}
      </div>
    </div>
    <template v-else>
      <div
        v-if="featuredChannels.length > 0"
        class="border-b dark:border-gray-600"
      >
        <h3 class="px-3 pt-3 text-sm uppercase text-gray-700 dark:text-gray-300">
          Featured Forums
        </h3>
        <div
          v-for="channel in featuredChannels"
          :key="channel.uniqueName"
          class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <SearchableForumListItem
            :channel="channel"
            :selected="selected"
            @toggle-selection="() => emit('toggleSelection', channel.uniqueName)"
          />
        </div>
      </div>
      <div class="pt-3">
        <h3 class="px-3 text-sm uppercase text-gray-700 dark:text-gray-300">All Forums</h3>
        <div
          v-for="channel in regularChannels"
          :key="channel.uniqueName"
          class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <SearchableForumListItem
            :channel="channel"
            :selected="selected"
            @toggle-selection="() => emit('toggleSelection', channel.uniqueName)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
<style>
  .touch-scroll-y {
    -webkit-overflow-scrolling: touch;
  }
</style>
