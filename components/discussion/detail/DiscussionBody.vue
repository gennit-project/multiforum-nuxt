<script lang="ts" setup>
  import { ref, computed, onMounted } from "vue";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import EmojiButtons from "@/components/comments/EmojiButtons.vue";
  import NewEmojiButton from "@/components/comments/NewEmojiButton.vue";
  import Tag from "../../TagComponent.vue";
  import ModelViewer from "@/components/ModelViewer.vue";
  import "md-editor-v3/lib/preview.css";
  import type { PropType } from "vue";
  import type { Discussion } from "@/__generated__/graphql";
  import { useRouter } from "nuxt/app";

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
    shaded: {
      type: Boolean,
      required: false,
      default: false,
    },
    wordLimit: {
      type: Number,
      required: false,
      default: 1000,
    },
    downloadMode: {
      type: Boolean,
      required: false,
      default: false,
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
      name: "forums-forumId-discussions",
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
  <div class="flex flex-col gap-2">
    <!-- 3D Model Viewer (Experiment) -->
    <ModelViewer
      v-if="discussion?.hasDownload && discussion?.downloadPreviewUrl"
      :model-url="discussion.downloadPreviewUrl"
    />
    <div
      v-if="discussion?.body && !downloadMode"
      class="rounded"
      :class="[shaded ? 'bg-gray-100 dark:bg-gray-700' : '']"
    >
      <MarkdownPreview
        :disable-gallery="false"
        :text="bodyText"
        :word-limit="wordLimit"
      />
    </div>

    <slot name="album-slot" />
    <div
      v-if="showEmojiButton"
      class="mt-2 flex"
    >
      <EmojiButtons
        :key="emojiJson"
        :discussion-channel-id="discussionChannelId"
        :emoji-json="emojiJson"
      />
    </div>
    <div class="flex gap-2">
      <Tag
        v-for="tag in discussion?.Tags"
        :key="tag.text"
        class="mt-2"
        :tag="tag.text"
        @click="filterByTag(tag.text)"
      />
    </div>

    <div
      v-if="!downloadMode"
      class="my-2"
    >
      <slot name="mark-answered-slot" />
    </div>
    <slot name="activity-feed-slot" />
    <div class="flex items-center gap-2">
      <slot name="button-slot" />
      <NewEmojiButton
        v-if="showEmojiButton && !downloadMode"
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
