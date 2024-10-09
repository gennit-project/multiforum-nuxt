<script lang="ts" setup>
import { computed, onMounted, ref, nextTick } from "vue";
import { VuemojiPicker } from "vuemoji-picker";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ADD_EMOJI_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { ADD_EMOJI_TO_DISCUSSION_CHANNEL } from "@/graphQLData/discussion/mutations";
import gql from "graphql-tag";
import { usernameVar } from "@/cache";

// Query to get the theme from the local state
const GET_THEME = gql`
  query getTheme {
    theme @client
  }
`;
const username = computed(() => usernameVar() || "");

// Mutation to add emoji to comment
const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);

// Mutation to add emoji to discussion channel
const { mutate: addEmojiToDiscussionChannel } = useMutation(ADD_EMOJI_TO_DISCUSSION_CHANNEL);

// Get the theme (light or dark mode)
const { result: themeResult, loading: themeLoading, error: themeError } = useQuery(GET_THEME);
const theme = computed(() => {
  if (themeLoading.value || themeError.value) return "";
  return themeResult.value?.theme;
});

const emojiPickerRef = ref(null);

onMounted(() => {
  nextTick(() => {
    const rootElement = emojiPickerRef.value?.$el;

    if (rootElement && rootElement.children.length > 0) {
      const emojiPickerElement = rootElement.children[0];

      if (emojiPickerElement.shadowRoot) {
        const inputElement = emojiPickerElement.shadowRoot.querySelector("#search");
        console.log('inputElement', inputElement);

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

  if (!username.value) {
    console.error("Username not found");
    return;
  }

  if (props.commentId) {
    addEmojiToComment({
      commentId: props.commentId,
      emojiLabel,
      unicode,
      username: username.value,
    });
    return;
  }

  if (props.discussionChannelId) {
    addEmojiToDiscussionChannel({
      discussionChannelId: props.discussionChannelId,
      emojiLabel,
      unicode,
      username: username.value,
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
        background: theme === 'dark' ? '#171c28' : '#fff',
        inputBorderRadius: '0.25rem',
        borderColor: theme === 'dark' ? '#1d2433' : '#e2e8f0',
        buttonHoverBackground: theme === 'dark' ? '#2d3748' : '#edf2f7',
      }"
      @emoji-click="handleEmojiClick"
    />
  </client-only>
</template>
