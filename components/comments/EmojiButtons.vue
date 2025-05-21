<script lang="ts" setup>
  import { useMutation } from "@vue/apollo-composable";
  import VoteButton from "@/components/VoteButton.vue";
  import { ADD_EMOJI_TO_COMMENT, REMOVE_EMOJI_FROM_COMMENT } from "@/graphQLData/comment/mutations";
  import {
    ADD_EMOJI_TO_DISCUSSION_CHANNEL,
    REMOVE_EMOJI_FROM_DISCUSSION_CHANNEL,
  } from "@/graphQLData/discussion/mutations";
  import { usernameVar } from "@/cache";
  import { ref } from "vue";

  // Props
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
    isPermalinked: {
      type: Boolean,
      required: false,
      default: false,
    },
  });

  const emojiObject = ref<Record<string, Record<string, string[]>>>({});
  if (props.emojiJson) {
    emojiObject.value = JSON.parse(props.emojiJson);
  }

  type EmojiVoteInput = {
    commentId?: string;
    discussionChannelId?: string;
    emojiLabel: string;
    unicode: string;
    username: string;
  };
  const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);
  const { mutate: removeEmojiFromComment } = useMutation(REMOVE_EMOJI_FROM_COMMENT);
  const { mutate: addEmojiToDiscussionChannel } = useMutation(ADD_EMOJI_TO_DISCUSSION_CHANNEL);
  const { mutate: removeEmojiFromDiscussionChannel } = useMutation(
    REMOVE_EMOJI_FROM_DISCUSSION_CHANNEL
  );

  // Helper methods
  function isActive(emojiLabel: string) {
    let active = false;
    const variants = emojiObject.value[emojiLabel] || {};
    for (const unicode in variants) {
      const usernames = variants[unicode];
      if (usernames.includes(usernameVar.value)) {
        active = true;
      }
    }
    return active;
  }

  function toggleCommentEmoji(emojiVoteInput: EmojiVoteInput) {
    if (isActive(emojiVoteInput.emojiLabel)) {
      removeEmojiFromComment(emojiVoteInput);
    } else {
      addEmojiToComment(emojiVoteInput);
    }
  }

  function toggleDiscussionChannelEmoji(emojiVoteInput: EmojiVoteInput) {
    if (isActive(emojiVoteInput.emojiLabel)) {
      removeEmojiFromDiscussionChannel(emojiVoteInput);
    } else {
      addEmojiToDiscussionChannel(emojiVoteInput);
    }
  }

  function getCount(emojiLabel: string) {
    let sumUsernames = 0;
    for (const unicode in emojiObject.value[emojiLabel]) {
      sumUsernames += emojiObject.value[emojiLabel][unicode].length;
    }
    return sumUsernames;
  }

  function getTooltipText(emojiLabel: string) {
    const count = getCount(emojiLabel);
    const usernames = Object.values(emojiObject.value[emojiLabel] || {}).flat();
    let tooltipText = usernames.slice(0, 5).join(", ");
    if (usernames.length > 5) {
      tooltipText += ` and ${count - 5} more`;
    }
    return `${tooltipText} reacted with :${emojiLabel}:`;
  }

  function getVariants(emojiLabel: string) {
    return emojiObject.value[emojiLabel] || {};
  }

  function getDefaultVariant(emojiLabel: string) {
    return Object.keys(getVariants(emojiLabel))[0];
  }
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <div
      v-for="emojiLabel in Object.keys(emojiObject)"
      :key="emojiLabel"
    >
      <VoteButton
        :active="isActive(emojiLabel)"
        class="space-x-2"
        :count="getCount(emojiLabel)"
        :is-permalinked="isPermalinked"
        :show-count="true"
        :test-id="'upvote-emoji-button'"
        :tooltip-text="getTooltipText(emojiLabel)"
        :tooltip-unicode="getDefaultVariant(emojiLabel)"
        @vote="
          () => {
            if (commentId) {
              toggleCommentEmoji({
                emojiLabel,
                unicode: getDefaultVariant(emojiLabel),
                username: usernameVar,
                commentId: commentId,
              });
            }
            if (discussionChannelId) {
              toggleDiscussionChannelEmoji({
                discussionChannelId: discussionChannelId,
                emojiLabel,
                unicode: getDefaultVariant(emojiLabel),
                username: usernameVar,
              });
            }
          }
        "
      >
        <span
          v-for="unicode in Object.keys(getVariants(emojiLabel))"
          :key="unicode"
          class="text-lg"
        >
          {{ unicode }}
        </span>
      </VoteButton>
    </div>
  </div>
</template>

<style>
  .custom-tooltip {
    opacity: var(--v-tooltip-opacity, 1) !important;
    border: 1px solid #30363e !important;
    background-color: black !important;
  }
</style>
