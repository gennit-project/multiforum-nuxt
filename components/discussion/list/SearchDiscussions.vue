<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import ChannelDiscussionList from "./ChannelDiscussionList.vue";
import SitewideDiscussionList from "./SitewideDiscussionList.vue";
import { useRoute, useRouter } from "vue-router";
import { getTagLabel, getChannelLabel } from "@/utils";
import { useDisplay } from "vuetify";
import { SearchDiscussionValues } from "@/types/Discussion";
import DiscussionFilterBar from "@/components/discussion/list/DiscussionFilterBar.vue";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";

interface Ref<T> {
  value: T;
}

export default defineComponent({
  components: {
    ChannelDiscussionList,
    DiscussionFilterBar,
    SitewideDiscussionList,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const discussionId = computed(() => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
      }
      return "";
    });

    const filterValues: Ref<SearchDiscussionValues> = ref(
      getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      }),
    );

    const selectedTags: Ref<Array<string>> = ref(
      route.params.tag && typeof route.params.tag === "string"
        ? [route.params.tag]
        : [],
    );

    const setSelectedTags = (tag: Array<string>) => {
      selectedTags.value = tag;
    };

    const defaultLabels = {
      channels: "Channels",
      tags: "Tags",
    };

    const channelLabel = computed(() => {
      return getChannelLabel(filterValues.value.channels);
    });

    const tagLabel = computed(() => {
      return getTagLabel(selectedTags.value);
    });

    const { lgAndDown, lgAndUp, mdAndDown, smAndDown } = useDisplay();
    const createDiscussionPath = channelId.value
      ? `/channels/c/${channelId.value}/discussions/create`
      : "/discussions/create";

    return {
      channelId,
      channelLabel,
      compareDate,
      createDiscussionPath,
      defaultLabels,
      discussionId,
      filterValues,
      lgAndDown,
      lgAndUp,
      mdAndDown,
      route,
      router,
      setSelectedTags,
      selectedTags,
      smAndDown,
      tagLabel,
    };
  },
  created() {
    this.$watch("$route.query", () => {
      if (this.$route.query) {
        this.filterValues = getFilterValuesFromParams({
          route: this.route,
          channelId: this.channelId,
        });
      }
    });
  },
  methods: {
    updateFilters(params: SearchDiscussionValues) {
      const existingQuery = this.$route.query;
      // Updating the URL params causes the events
      // to be refetched by the EventListView
      // and MapView components
      this.$router.replace({
        query: {
          ...existingQuery,
          ...params,
        },
      });
    },
    handleClickTag(tagText: string) {
      const currentQuery = this.$route.query;

      const clearTags = () => {
        // If we're already filtering by the tag only, clear it.
        const newQuery = { ...this.$route.query };
        delete newQuery["tags"];

        this.$router.replace({
          query: {
            ...newQuery,
          },
        });

        this.filterValues.tags = this.filterValues.tags.filter(
          (t: string) => t !== tagText,
        );
      };

      const removeOnlyThisTag = () => {
        // If we're already filtering by multiple tags including this tag,
        // remove only this tag.
        const newQuery = { ...this.$route.query };
        newQuery.tags = newQuery.tags.filter((tag: string) => {
          return tag !== tagText;
        });

        this.$router.replace({
          query: {
            ...newQuery,
          },
        });
        this.filterValues.tags.push(tagText);
      };

      const alreadyFilteringByOnlyThisTag =
        currentQuery.tags &&
        typeof currentQuery.tags === "string" &&
        tagText === currentQuery.tags;

      const alreadyFilteringByMultipleTagsIncludingThisTag =
        currentQuery.tags &&
        typeof currentQuery.tags === "object" &&
        currentQuery.tags.includes(tagText);

      if (alreadyFilteringByOnlyThisTag) {
        clearTags();
      } else if (alreadyFilteringByMultipleTagsIncludingThisTag) {
        removeOnlyThisTag();
      } else {
        // If we are not already filtering by the tag,
        // add it to the existing tag filters.
        this.updateFilters({ tags: [tagText] });
      }
    },
    handleClickChannel(uniqueName: string) {
      const currentQuery = this.$route.query;

      const alreadyFilteringByThisChannel =
        currentQuery.channels &&
        typeof currentQuery.channels === "string" &&
        uniqueName === currentQuery.channels;
      const alreadyFilteringByMultipleChannelsIncludingThisChannel =
        currentQuery.channels &&
        typeof currentQuery.channels === "object" &&
        currentQuery.channels.includes(uniqueName);

      const clearChannels = () => {
        // If we're already filtering by the channel, clear it.
        const newQuery = { ...this.$route.query };
        delete newQuery["channels"];

        this.$router.replace({
          query: {
            ...newQuery,
          },
        });

        this.filterValues.channels = this.filterValues.channels.filter(
          (c: string) => c !== uniqueName,
        );
      };

      const removeOnlyThisChannel = () => {
        // If we're already filtering by multiple channels including this channel,
        // remove only this channel.
        const newQuery = { ...this.$route.query };
        newQuery.channels = newQuery.channels.filter((channel: string) => {
          return channel !== uniqueName;
        });

        this.$router.replace({
          query: {
            ...newQuery,
          },
        });
        this.filterValues.channels.push(uniqueName);
      };

      if (alreadyFilteringByThisChannel) {
        clearChannels();
      } else if (alreadyFilteringByMultipleChannelsIncludingThisChannel) {
        removeOnlyThisChannel();
      } else {
        // If we are not already filtering by the channel,
        // add it to the existing channel filters.
        this.updateFilters({ channels: [uniqueName] });
      }
    },
    setSelectedChannels(channels: Array<string>) {
      this.selectedChannels = channels;
    },
  },
});
</script>

<template>
  <v-container
    :class="[channelId ? '' : 'max-w-4xl']"
    class="justify-center rounded-lg p-0"
  >
    <SitewideDiscussionList
      v-if="!channelId"
      @filterByTag="handleClickTag"
      @filterByChannel="handleClickChannel"
    >
      <DiscussionFilterBar />
    </SitewideDiscussionList>
    <ChannelDiscussionList
      v-else
      :channel-id="channelId"
      :search-input="filterValues.searchInput"
      :selected-tags="filterValues.tags"
      :selected-channels="filterValues.channels"
      @filterByTag="handleClickTag"
      @filterByChannel="handleClickChannel"
    >
      <DiscussionFilterBar />
    </ChannelDiscussionList>
  </v-container>
</template>

<style>
.height-constrained {
  max-height: 50px;
}
.min-w-lg {
  min-width: 1300px;
}

.scrollable-column {
  height: 99vh;
  overflow-y: auto;
}
</style>
