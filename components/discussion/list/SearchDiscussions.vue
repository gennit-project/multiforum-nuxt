<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import ChannelDiscussionList from "./ChannelDiscussionList.vue";
  import SitewideDiscussionList from "./SitewideDiscussionList.vue";
  import DiscussionFilterBar from "@/components/discussion/list/DiscussionFilterBar.vue";
  import { getFilterValuesFromParams } from "./getDiscussionFilterValuesFromParams";
  import type { SearchDiscussionValues } from "@/types/Discussion";

  // Props and Emits
  defineEmits(["filterByTag", "filterByChannel"]);

  defineProps({
    isForumScoped: {
      type: Boolean,
      default: false,
    },
  });

  // Setup function
  const route = useRoute();
  const router = useRouter();

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const filterValues = ref(
    getFilterValuesFromParams({
      route,
      channelId: channelId.value,
    })
  );

  // Watchers
  watch(
    () => route.query,
    () => {
      if (route.query) {
        filterValues.value = getFilterValuesFromParams({
          route,
          channelId: channelId.value,
        });
      }
    }
  );

  // Methods
  const updateFilters = (params: SearchDiscussionValues) => {
    const existingQuery = route.query;
    router.replace({
      query: {
        ...existingQuery,
        ...params,
      },
    });
  };

  const handleClickTag = (tagText: string) => {
    const currentQuery = route.query;

    const clearTags = () => {
      const newQuery = { ...route.query };
      delete newQuery["tags"];
      router.replace({ query: { ...newQuery } });
      if (!filterValues.value.tags) {
        filterValues.value.tags = [];
      }
      filterValues.value.tags = filterValues.value.tags.filter((t: string) => t !== tagText);
    };

    const removeOnlyThisTag = () => {
      const newQuery = { ...route.query };
      if (newQuery.tags === null) {
        newQuery.tags = [];
      }
      if (typeof newQuery.tags === "string") {
        newQuery.tags = [newQuery.tags];
      } else if (Array.isArray(newQuery.tags)) {
        newQuery.tags = newQuery.tags.filter((tag: any) => tag !== tagText);
      }
      router.replace({ query: { ...newQuery } });
      if (!filterValues.value.tags) {
        filterValues.value.tags = [];
      }
      filterValues.value.tags.push(tagText);
    };

    const alreadyFilteringByOnlyThisTag =
      currentQuery.tags && typeof currentQuery.tags === "string" && tagText === currentQuery.tags;

    const alreadyFilteringByMultipleTagsIncludingThisTag =
      currentQuery.tags &&
      typeof currentQuery.tags === "object" &&
      currentQuery.tags.includes(tagText);

    if (alreadyFilteringByOnlyThisTag) {
      clearTags();
    } else if (alreadyFilteringByMultipleTagsIncludingThisTag) {
      removeOnlyThisTag();
    } else {
      updateFilters({ tags: [tagText] });
    }
  };

  const handleClickChannel = (uniqueName: string) => {
    const currentQuery = route.query;

    const alreadyFilteringByThisChannel =
      currentQuery.channels &&
      typeof currentQuery.channels === "string" &&
      uniqueName === currentQuery.channels;

    const alreadyFilteringByMultipleChannelsIncludingThisChannel =
      currentQuery.channels &&
      typeof currentQuery.channels === "object" &&
      currentQuery.channels.includes(uniqueName);

    const clearChannels = () => {
      const newQuery = { ...route.query };
      delete newQuery["channels"];
      router.replace({ query: { ...newQuery } });
      if (!filterValues.value.channels) {
        filterValues.value.channels = [];
      }
      filterValues.value.channels = filterValues.value.channels.filter(
        (c: string) => c !== uniqueName
      );
    };

    const removeOnlyThisChannel = () => {
      const newQuery = { ...route.query };
      if (newQuery.channels === null) {
        newQuery.channels = [];
      }
      if (typeof newQuery.channels === "string") {
        newQuery.channels = [newQuery.channels];
      } else if (Array.isArray(newQuery.channels)) {
        newQuery.channels = newQuery.channels.filter((channel: any) => channel !== uniqueName);
      }
      router.replace({ query: { ...newQuery } });
      if (!filterValues.value.channels) {
        filterValues.value.channels = [];
      }
      filterValues.value.channels.push(uniqueName);
    };

    if (alreadyFilteringByThisChannel) {
      clearChannels();
    } else if (alreadyFilteringByMultipleChannelsIncludingThisChannel) {
      removeOnlyThisChannel();
    } else {
      updateFilters({ channels: [uniqueName] });
    }
  };
</script>

<template>
  <SitewideDiscussionList
    v-if="!isForumScoped"
    @filter-by-channel="handleClickChannel"
    @filter-by-tag="handleClickTag"
  >
    <DiscussionFilterBar :is-forum-scoped="isForumScoped" />
  </SitewideDiscussionList>
  <ChannelDiscussionList
    v-else
    :channel-id="channelId"
    :search-input="filterValues.searchInput"
    :selected-channels="filterValues.channels"
    :selected-tags="filterValues.tags"
    @filter-by-channel="handleClickChannel"
    @filter-by-tag="handleClickTag"
  >
    <DiscussionFilterBar :is-forum-scoped="isForumScoped" />
  </ChannelDiscussionList>
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
