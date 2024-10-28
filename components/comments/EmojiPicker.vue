<script lang="ts" setup>
import { onMounted, ref, nextTick } from "vue";
import { VuemojiPicker } from "vuemoji-picker";
import { useMutation } from "@vue/apollo-composable";
import { ADD_EMOJI_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { ADD_EMOJI_TO_DISCUSSION_CHANNEL } from "@/graphQLData/discussion/mutations";
import gql from "graphql-tag";
import { usernameVar } from "@/cache";

// Mutation to add emoji to comment
const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);

// Mutation to add emoji to discussion channel
const { mutate: addEmojiToDiscussionChannel } = useMutation(ADD_EMOJI_TO_DISCUSSION_CHANNEL);

const emojiPickerRef = ref(null);

onMounted(() => {
  nextTick(() => {
    const rootElement = emojiPickerRef.value?.$el;

    if (rootElement && rootElement.children.length > 0) {
      const emojiPickerElement = rootElement.children[0];

      if (emojiPickerElement.shadowRoot) {
        const inputElement = emojiPickerElement.shadowRoot.querySelector("#search");

        if (inputElement) {
          setTimeout(() => {
            inputElement.focus();
          }, 300);
        } else {
          console.error("Input element not found in shadow DOM");
        }
      } else {
        console.error("Shadow root not found on emoji-picker element");
      }
    } else {
      console.error("emoji-picker child element not found");
    }
  });
});

// Props for the component
const props = defineProps({
  commentId: {
    type: String,
    required: false,
    default: "",
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
});

// Handle clicking an emoji and sending mutations based on comment or discussion ID
function handleEmojiClick(event: any) {
  const unicode = event.unicode;
  const emojiLabel = event.emoji.annotation;

  if (!usernameVar.value) {
    console.error("Username not found");
    return;
  }

  if (props.commentId) {
    addEmojiToComment({
      commentId: props.commentId,
      emojiLabel,
      unicode,
      username: usernameVar.value,
    });
    return;
  }

  if (props.discussionChannelId) {
    addEmojiToDiscussionChannel({
      discussionChannelId: props.discussionChannelId,
      emojiLabel,
      unicode,
      username: usernameVar.value,
    });
  }

  // Emit the emojiClick event
  emit("emojiClick");
}

// Emit close event when clicking outside
const emit = defineEmits(["close", "emojiClick"]);
function outside() {
  emit("close");
}

</script>

<template>
  <client-only>
    <VuemojiPicker
      ref="emojiPickerRef"
      v-click-outside="outside"
      :picker-style="{
        inputBorderRadius: '0',
        borderColor: 'transparent',
        buttonHoverBackground: 'transparent',
      }"
      class="!bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-800 rounded-lg shadow-lg"
      @emoji-click="handleEmojiClick"
    />
  </client-only>
</template>
