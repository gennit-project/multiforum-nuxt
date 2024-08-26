<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import ChannelList from "./ChannelList.vue";
import { GET_CHANNELS } from "@/graphQLData/channel/queries";
import { GET_TAGS } from "@/graphQLData/tag/queries";
import { TagData } from "@/types/Tag";
import { Channel } from "@/src/__generated__/graphql";
import TagIcon from "@/components/icons/TagIcon.vue";
import FilterChip from "@/components/FilterChip.vue";
// import TagPicker from "@/components/TagPicker.vue";
import ErrorBanner from "../ErrorBanner.vue";
import { getTagLabel } from "@/utils";
import { useRoute } from "vue-router";
import SearchBar from "../SearchBar.vue";

interface Ref<T> {
  value: T;
}

export default defineComponent({
  components: {
    ChannelList,
    ErrorBanner,
    FilterChip,
    SearchBar,
    // TagPicker,
    TagIcon,
  },
  setup() {
    const route = useRoute();
    const links = computed(() => {
      return [
        {
          label: "Channels",
          path: "channels",
        },
      ];
    });

    const showModal: Ref<boolean | undefined> = ref(false);
    const selectedFilterOptions: Ref<string> = ref("");

    const selectedTags: Ref<Array<string>> = ref(
      route.params.tag && typeof route.params.tag === "string"
        ? [route.params.tag]
        : [],
    );
    const searchInput: Ref<string> = ref("");

    const setSearchInput = (input: string) => {
      searchInput.value = input;
    };
    const setSelectedTags = (tag: Array<string>) => {
      selectedTags.value = tag;
    };

    const channelWhere = computed(() => {
      if (selectedTags.value.length === 0 && searchInput.value === "") {
        return {};
      }
      const tagSearch = {
        Tags: {
          OR: selectedTags.value.map((tag: string) => {
            return { text_CONTAINS: tag };
          }),
        },
      };

      const textSearch = {
        OR: [
          {
            uniqueName_MATCHES: `(?i).*${searchInput.value}.*`,
          },
          {
            description_MATCHES: `(?i).*${searchInput.value}.*`,
          },
        ],
      };

      if (selectedTags.value.length === 0) {
        return {
          OR: [textSearch],
        };
      }

      if (searchInput.value === "") {
        return {
          OR: [tagSearch],
        };
      }

      return {
        AND: [tagSearch, textSearch],
      };
    });

    const now = new Date().toISOString();

    const {
      error: channelError,
      result: channelResult,
      loading: channelLoading,
      fetchMore,
      error,
    } = useQuery(GET_CHANNELS, {
      channelWhere: channelWhere,
      eventChannelWhere: {
        Event: {
          startTime_GT: now,
          canceled: false,
        },
      },
      limit: 25,
      offset: 0,
      sort: {
        createdAt: "ASC",
      },
    });

    if (error.value) {
      alert(JSON.stringify(error.value));
    }

    const reachedEndOfResults = ref(false);

    const loadMore = () => {
      fetchMore({
        variables: {
          offset: channelResult.value.channels.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          return {
            ...previousResult,
            channels: [...previousResult.channels, ...fetchMoreResult.channels],
          };
        },
      });
    };

    const { result: tagOptions } = useQuery(GET_TAGS);

    const openModal = (selectedFilter: string) => {
      showModal.value = true;
      selectedFilterOptions.value = selectedFilter;
    };
    const closeModal = () => {
      showModal.value = false;
      selectedFilterOptions.value = "";
    };

    const defaultLabels = {
      tags: "Tags",
    };

    const tagLabel = computed(() => {
      return getTagLabel(selectedTags.value);
    });

    return {
      closeModal,
      channelError,
      channelLoading,
      channelResult,
      channelWhere,
      defaultLabels,
      links,
      loadMore,
      openModal,
      reachedEndOfResults,
      searchInput,
      setSearchInput,
      setSelectedTags,
      showModal,
      selectedFilterOptions,
      selectedTags,
      tagLabel,
      tagOptions,
    };
  },
  data() {
    return {
      queryChannel: [],
      createChannelPath: "/channels/create",
    };
  },
  methods: {
    getTagOptionLabels(options: Array<TagData>) {
      return options.map((tag) => tag.text);
    },
    getChannelOptionLabels(options: Array<Channel>) {
      return options.map((channel) => channel.uniqueName);
    },
    updateSearchResult(input: string) {
      this.setSearchInput(input);
    },
    filterByTag(tag: string) {
      // If it is actively selected, clear it.
      // Otherwise, set selected tags to [tag].
      if (this.selectedTags.includes(tag)) {
        this.setSelectedTags([]);
        return;
      }
      this.setSelectedTags([tag]);
    },
  },
});
</script>

<template>
  <div class="bg-gray-200 dark:bg-black">
    <div class="py-6">
      <div
        class="mx-auto flex max-w-3xl items-center justify-between px-4 py-2"
      >
        <SearchBar
          class="mr-2 w-full align-middle"
          :search-placeholder="'Search forums'"
          @updateSearchInput="updateSearchResult"
        />
        <FilterChip
          :label="tagLabel"
          :highlighted="tagLabel !== defaultLabels.tags"
        >
          <template #icon>
            <TagIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <!-- <TagPicker
              :selected-tags="selectedTags"
              @setSelectedTags="setSelectedTags"
            /> -->
          </template>
        </FilterChip>
      </div>
      <ErrorBanner
        v-if="channelError"
        class="mx-auto max-w-5xl"
        :text="channelError.message"
      />
      <ChannelList
        v-if="channelResult && channelResult.channels"
        class="mx-auto max-w-3xl flex-1 rounded-lg bg-gray-100 md:p-6 text-xl font-bold dark:bg-gray-900"
        :channels="channelResult.channels"
        :result-count="channelResult.channelsAggregate?.count || 0"
        :search-input="searchInput"
        :selected-tags="selectedTags"
        @filterByTag="filterByTag"
        @loadMore="loadMore"
      />
      <div
        v-if="channelLoading"
        class="mx-auto max-w-5xl flex-1"
      >
        Loading...
      </div>
    </div>
  </div>
</template>
