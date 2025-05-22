<script lang="ts" setup>
  import { onMounted, ref, nextTick } from "vue";
  import { VuemojiPicker } from "vuemoji-picker";
  import { useMutation } from "@vue/apollo-composable";
  import { ADD_EMOJI_TO_COMMENT } from "@/graphQLData/comment/mutations";
  import { ADD_EMOJI_TO_DISCUSSION_CHANNEL } from "@/graphQLData/discussion/mutations";

  import { usernameVar } from "@/cache";
  // Mutation to add emoji to comment
  const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);

  // Mutation to add emoji to discussion channel
  const { mutate: addEmojiToDiscussionChannel } = useMutation(ADD_EMOJI_TO_DISCUSSION_CHANNEL);

  const emojiPickerRef = ref<InstanceType<typeof VuemojiPicker> | null>(null);

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
    console.log("EmojiPicker received event:", event);

    if (!event) {
      console.error("No event data received in handleEmojiClick");
      return;
    }

    const unicode = event.unicode;
    const emoji = event.emoji;

    if (!unicode || !emoji) {
      console.error("Missing unicode or emoji in handleEmojiClick event", event);
      return;
    }

    const emojiLabel = emoji.annotation;

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
    } else if (props.discussionChannelId) {
      addEmojiToDiscussionChannel({
        discussionChannelId: props.discussionChannelId,
        emojiLabel,
        unicode,
        username: usernameVar.value,
      });
    }

    // Only emit one event type based on how the component is being used
    // We now use emoji-click for the TextEditor and emojiClick for legacy usages
    const eventData = { unicode, emoji: emoji.char };

    // Use kebab-case for Vue template event binding (@emoji-click)
    emit("emoji-click", eventData);
  }

  // Emit events
  const emit = defineEmits(["close", "emoji-click"]);
  function outside() {
    emit("close");
  }
</script>

<template>
  <client-only>
    <VuemojiPicker
      ref="emojiPickerRef"
      v-click-outside="outside"
      class="rounded-lg border border-gray-500 !bg-white shadow-lg dark:border-gray-800 dark:bg-gray-700"
      :picker-style="{
        inputBorderRadius: '0',
        borderColor: 'transparent',
        buttonHoverBackground: 'transparent',
      }"
      @emoji-click="handleEmojiClick"
    />
  </client-only>
</template>
