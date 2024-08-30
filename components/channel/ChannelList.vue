<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import type { Channel } from "@/src/__generated__/graphql";
import ChannelListItem from "@/components/channel/ChannelListItem.vue";
import LoadMore from "../LoadMore.vue";

export default defineComponent({
  components: {
    ChannelListItem,
    LoadMore,
  },
  props: {
    channels: {
      type: Array as PropType<Array<Channel>>,
      default: () => {
        return [];
      },
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    searchInput: {
      type: String,
      default: "",
    },
    selectedTags: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
  },
  setup() {},
  methods: {
    filterByTag(tag: string) {
      this.$emit("filterByTag", tag);
    },
  },
});
</script>

<template>
  <div>
    <p
      v-if="channels.length === 0"
      class="mt-2 text-sm font-normal dark:text-white"
    >
      There are no results.
    </p>
    <div class="grid gap-4 md:grid-cols-1">
      <ChannelListItem
        v-for="channel in channels"
        :key="channel.uniqueName"
        :channel="channel"
        :search-input="searchInput"
        :selected-tags="selectedTags"
        @filter-by-tag="filterByTag"
      />
    </div>
    <div class="m-10 grid justify-items-stretch">
      <LoadMore
        class="justify-self-center font-normal"
        :reached-end-of-results="resultCount === channels.length"
        @load-more="$emit('loadMore')"
      />
    </div>
  </div>
</template>
