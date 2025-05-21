<script setup lang="ts">
  import { computed } from "vue";
  import { relativeTime } from "@/utils";
  import Tag from "@/components/TagComponent.vue";
  import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
  import type { Discussion } from "@/__generated__/graphql";
  import { useRouter } from "nuxt/app";

  const props = defineProps({
    discussion: {
      type: Object as () => Discussion,
      required: true,
    },
    searchInput: {
      type: String,
      default: "",
    },
    selectedTags: {
      type: Array as () => string[],
      default: () => [],
    },
    selectedChannels: {
      type: Array as () => string[],
      default: () => [],
    },
  });

  defineEmits(["filterByTag"]);

  const router = useRouter();

  const defaultUniqueName = computed(() => {
    if (!props.discussion.DiscussionChannels || !props.discussion.DiscussionChannels[0]) {
      return "";
    }
    return props.discussion.DiscussionChannels[0].Channel?.uniqueName;
  });

  const title = props.discussion.title;
  const relativeTimeText = relativeTime(props.discussion.createdAt);
  const authorUsername = props.discussion.Author ? props.discussion.Author.username : "Deleted";
  const tags = (props.discussion.Tags ?? []).map((tag) => tag.text);
</script>

<template>
  <li
    class="relative cursor-pointer list-none rounded-lg bg-white p-4 dark:bg-gray-800 dark:text-white"
    @click="
      () => {
        if (defaultUniqueName) {
          router.push(`/forums/${defaultUniqueName}/discussions/${discussion.id}`);
        }
      }
    "
  >
    <HighlightedSearchTerms
      :search-input="searchInput"
      :text="title"
    />

    <p class="mt-1 flex space-x-1 text-sm font-medium text-gray-600 hover:no-underline">
      <Tag
        v-for="tag in tags"
        :key="tag"
        :active="selectedTags.includes(tag)"
        class="my-1"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </p>
    <p class="text-xs font-medium text-gray-600 no-underline dark:text-gray-300">
      {{ `Posted ${relativeTimeText} by ${authorUsername}` }}
    </p>
    <div class="my-2 space-x-2 text-sm">
      <nuxt-link
        v-for="(discussionChannel, i) in discussion.DiscussionChannels"
        :key="i"
        class="text-gray-500 underline hover:text-gray-700 dark:text-gray-300 hover:dark:text-gray-200"
        :to="{
          name: 'forums-forumId-discussions-discussionId',
          params: {
            forumId: discussionChannel.Channel?.uniqueName || discussionChannel.channelUniqueName,
            discussionId: discussion.id,
          },
        }"
      >
        View this post in
        {{ `c/${discussionChannel.Channel?.uniqueName || discussionChannel.channelUniqueName}` }}
      </nuxt-link>
    </div>
  </li>
</template>

<style>
  .highlighted {
    background-color: #f9f95d;
  }
</style>
