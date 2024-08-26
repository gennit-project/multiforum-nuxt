<script lang="ts">
import { defineComponent, computed, PropType, ref } from "vue";
import { getLinksInText } from "@/utils";
import { Discussion } from "@/src/__generated__/graphql";
import { useRoute } from "vue-router";
import Tag from "../../Tag.vue";
import "md-editor-v3/lib/preview.css";
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import EmojiButtons from "@/components/comments/EmojiButtons.vue";
import NewEmojiButton from "@/components/comments/NewEmojiButton.vue";

export default defineComponent({
  components: {
    EmojiButtons,
    Tag,
    MarkdownPreview,
    NewEmojiButton,
  },
  props: {
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
  },
  setup(props) {
    const route = useRoute();

    const bodyText = computed(() => {
      if (!props.discussion || !props.discussion.body) {
        return "";
      }
      return props.discussion.body;
    });

    const linksInBody = computed(() => {
      if (!props.discussion || !props.discussion.body) {
        return [];
      }
      const links = getLinksInText(props.discussion.body);
      return links;
    });

    const GET_THEME = gql`
      query GetTheme {
        theme @client
      }
    `;

    const { result } = useQuery(GET_THEME);

    const theme = computed(() => {
      return result.value?.theme || "light";
    });
    return {
      linksInBody,
      route,
      bodyText,
      scrollElement: document.documentElement,
      id: "preview-only",
      showEmojiPicker: ref(false),
      theme,
    };
  },
  methods: {
    filterByTag(tag: string) {
      this.$router.push({
        name: "SearchDiscussionsInChannel",
        params: {
          channelId: this.channelId,
        },
        query: {
          tags: tag,
        },
      });
    },
  },
});
</script>
<template>
  <div class="md:px-2">
    <div
      v-if="discussion?.body"
      class="-ml-2 md:-ml-4 -mt-4 max-w-none"
    >
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
        @click="
          () => {
            filterByTag(tag.text);
          }
        "
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
