<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import EmojiButtons from "@/components/comments/EmojiButtons.vue";
import NewEmojiButton from "@/components/comments/NewEmojiButton.vue";
import Tag from "../../TagComponent.vue";
import "md-editor-v3/lib/preview.css";
import type { PropType } from "vue";
import type { Discussion } from "@/__generated__/graphql";

const route = useRoute();
const router = useRouter();

const props = defineProps({
  channelId: {
    type: String,
    required: true,
  },
  discussion: {
    type: Object as PropType<Discussion | null>,
    required: false,
    default: null,
  },
  discussionChannelId: {
    type: String,
    required: false,
    default: "",
  },
  emojiJson: {
    type: String,
    required: false,
    default: "",
  },
  showEmojiButton: {
    type: Boolean,
    required: false,
    default: true,
  },
  wordLimit: {
    type: Number,
    required: false,
    default: 1000,
  },
});

// Computed properties for discussion body and links
const bodyText = computed(() => {
  return props.discussion?.body || "";
});


// Scroll element setup, ensure document.documentElement is accessed only on the client-side
const scrollElement = ref<HTMLElement | null>(null);

onMounted(() => {
  if (import.meta.client) {
    scrollElement.value = document.documentElement;
  }
});

// Method for filtering discussions by tag
const filterByTag = (tag: string) => {
  router.push({
    name: "SearchDiscussionsInChannel",
    params: {
      forumId: props.channelId,
    },
    query: {
      tags: tag,
    },
  });
};
</script>

<template>
  <div class="md:px-2">
    <div v-if="discussion?.body" class="-ml-2 md:-ml-4 -mt-4 max-w-none">
      <MarkdownPreview
        :text="bodyText"
        :disable-gallery="route.name !== 'DiscussionDetail'"
        :word-limit="wordLimit"
      />
    </div>
    <div class="flex mt-2">
      <EmojiButtons
        :key="emojiJson"
        :discussion-channel-id="discussionChannelId"
        :emoji-json="emojiJson"
      />
    </div>
    <div class="flex gap-1">
      <Tag
        v-for="tag in discussion?.Tags"
        :key="tag.text"
        class="mt-2"
        :tag="tag.text"
        @click="filterByTag(tag.text)"
      />
    </div>
    <slot name="album-slot" />
    <div class="flex items-center gap-2">
      <slot name="button-slot" />
      <NewEmojiButton
        v-if="showEmojiButton"
        :discussion-channel-id="discussionChannelId"
      />
    </div>
  </div>
</template>

<style scoped>
li {
  list-style-type: disc;
}
</style>
