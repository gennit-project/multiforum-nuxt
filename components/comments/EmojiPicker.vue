<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { VuemojiPicker } from "vuemoji-picker";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ADD_EMOJI_TO_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { ADD_EMOJI_TO_DISCUSSION_CHANNEL } from "@/graphQLData/discussion/mutations";
import clickOutside from "vue-click-outside";
import gql from "graphql-tag";

export default defineComponent({
  name: "EmojiPicker",
  components: {
    VuemojiPicker,
  },
  directives: {
    clickOutside,
  },
  props: {
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
  },
  setup() {
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);
    const username = computed(() => {
      return localUsernameResult.value.username;
    });

    const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);

    const { mutate: addEmojiToDiscussionChannel } = useMutation(
      ADD_EMOJI_TO_DISCUSSION_CHANNEL,
    );

    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    const emojiPickerRef = ref(null);
    onMounted(() => {
      const rootElement = emojiPickerRef.value?.$el;

      if (rootElement && rootElement.children.length > 0) {
        const emojiPickerElement = rootElement.children[0];

        if (emojiPickerElement.shadowRoot) {
          const inputElement =
            emojiPickerElement.shadowRoot.querySelector("#search");

          if (inputElement) {
            setTimeout(() => {
              inputElement.focus();
            }, 300); // Delay focus to ensure the element is ready
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

    return {
      addEmojiToComment,
      addEmojiToDiscussionChannel,
      emojiPickerRef,
      theme,
      username,
    };
  },
  methods: {
    outside() {
      this.$emit("close");
    },
    handleEmojiClick(event: any) {
      const unicode = event.unicode;
      const emojiLabel = event.emoji.annotation;

      if (this.commentId) {
        this.addEmojiToComment({
          commentId: this.commentId,
          emojiLabel,
          unicode,
          username: this.username,
        });
        return;
      }

      if (this.discussionChannelId) {
        this.addEmojiToDiscussionChannel({
          discussionChannelId: this.discussionChannelId,
          emojiLabel,
          unicode,
          username: this.username,
        });
      }

      this.$emit("emojiClick");
    },
  },
});
</script>

<template>
  <VuemojiPicker
    ref="emojiPickerRef"
    :picker-style="{
      background: theme === 'dark' ? '#171c28' : '#fff',
      inputBorderRadius: '0.25rem',
      borderColor: theme === 'dark' ? '#1d2433' : '#e2e8f0',
      buttonHoverBackground: theme === 'dark' ? '#2d3748' : '#edf2f7',
    }"
    @emojiClick="handleEmojiClick"
  />
</template>
