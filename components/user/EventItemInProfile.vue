<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, computed } from "vue";
import type { TagData } from "../../types/Tag";
import { relativeTime } from "@/utils";
import { useRoute, useRouter } from "vue-router";
import Tag from "@/components/TagComponent.vue";
import type { Event } from "@/src/__generated__/graphql";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";

export default defineComponent({
  components: {
    Tag,
    HighlightedSearchTerms,
  },
  inheritAttrs: false,
  props: {
    event: {
      type: Object as PropType<Event>,
      required: true,
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
    selectedChannels: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
  },
  setup() {},
  data(props) {
    const route = useRoute();
    const router = useRouter();

    const defaultUniqueName = computed(() => {
      if (!props.event.EventChannels || !props.event.EventChannels[0]) {
        return "";
      }
      return props.event.EventChannels[0].channelUniqueName;
    });
    return {
      router,
      defaultUniqueName,
      previewIsOpen: false,
      title: props.event.title,
      createdAt: props.event.createdAt,
      relativeTime: relativeTime(props.event.createdAt),
      poster: props.event.Poster ? props.event.Poster.username : "Deleted",
      // If we are already within the channel, don't show
      // links to cost channels and don't specify which
      // channel the comments are in.
      tags: props.event.Tags.map((tag: TagData) => {
        return tag.text;
      }),
      route,
    };
  },
});
</script>

<template>
  <li
    class="relative cursor-pointer list-none rounded-lg bg-white p-4 dark:bg-gray-800"
    @click="
      () => {
        if (defaultUniqueName) {
          router.push(`/channels/c/${defaultUniqueName}/events/e/${event.id}`);
        }
      }
    "
  >
    <p class="text-lg font-bold">
      <HighlightedSearchTerms
        :text="title"
        :search-input="searchInput"
      />
    </p>

    <p
      class="font-medium flex text-xs text-gray-600 no-underline dark:text-gray-300"
    >
      <Tag
        v-for="tag in tags"
        :key="tag"
        class="my-1"
        :active="selectedTags.includes(tag)"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </p>
    <p
      class="font-medium text-xs text-gray-600 no-underline dark:text-gray-300"
    >
      {{ `Posted ${relativeTime} by ${poster}` }}
    </p>
    <div
      v-for="(ec, i) in event.EventChannels"
      :key="i"
      class="my-2 space-x-2 text-sm"
    >
      <router-link
        v-if="ec.Channel"
        class="text-gray-500 underline hover:text-gray-700 dark:text-gray-300 hover:dark:text-gray-200"
        :to="`/channels/c/${ec.Channel.uniqueName}/events/e/${event.id}`"
      >
        {{ `c/${ec.Channel.uniqueName}` }}
      </router-link>
    </div>
  </li>
</template>
<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
