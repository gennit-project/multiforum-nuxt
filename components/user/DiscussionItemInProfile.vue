<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, computed } from "vue";
import type { DiscussionData } from "../../types/Discussion";
import { relativeTime } from "@/utils";
import { useRoute, useRouter } from "vue-router";
import Tag from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";

export default defineComponent({
  components: {
    Tag,
    HighlightedSearchTerms,
  },
  inheritAttrs: false,
  props: {
    discussion: {
      type: Object as PropType<DiscussionData>,
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
      if (
        !props.discussion.DiscussionChannels ||
        !props.discussion.DiscussionChannels[0]
      ) {
        return "";
      }
      return props.discussion.DiscussionChannels[0].Channel?.uniqueName;
    });
    return {
      router,
      previewIsOpen: false,
      defaultUniqueName, //props.discussion.DiscussionChannels[0].Channel.uniqueName,
      title: props.discussion.title,
      body: props.discussion.body || "",
      createdAt: props.discussion.createdAt,
      relativeTime: relativeTime(props.discussion.createdAt),
      authorUsername: props.discussion.Author
        ? props.discussion.Author.username
        : "Deleted",
      // If we are already within the channel, don't show
      // links to cost channels and don't specify which
      // channel the comments are in.
      tags: props.discussion.Tags.map((tag) => {
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
          router.push(
            `/channels/c/${defaultUniqueName}/discussions/d/${discussion.id}`,
          );
        }
      }
    "
  >
    <p class="cursor-pointer text-lg font-bold">
      <HighlightedSearchTerms
        :text="title"
        :search-input="searchInput"
      />
    </p>

    <p class="font-medium mt-1 space-x-1 flex text-sm text-gray-600 hover:no-underline">
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
      {{ `Posted ${relativeTime} by ${authorUsername}` }}
    </p>
    <div class="my-2 space-x-2 text-sm">
      <router-link
        v-for="(discussionChannel, i) in discussion.DiscussionChannels"
        :key="i"
        class="text-gray-500 underline hover:text-gray-700 dark:text-gray-300 hover:dark:text-gray-200"
        :to="`/channels/c/${discussionChannel.Channel?.uniqueName}/discussions/d/${discussion.id}`"
      >
        View this post in {{ `c/${discussionChannel.Channel?.uniqueName}` }}
      </router-link>
    </div>
  </li>
</template>
<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
