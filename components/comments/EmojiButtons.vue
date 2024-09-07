<script lang="ts">
import { computed, defineComponent } from "vue";
import VoteButton from "@/components/VoteButton.vue";
import {
  ADD_EMOJI_TO_COMMENT,
  REMOVE_EMOJI_FROM_COMMENT,
} from "@/graphQLData/comment/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import {
  ADD_EMOJI_TO_DISCUSSION_CHANNEL,
  REMOVE_EMOJI_FROM_DISCUSSION_CHANNEL,
} from "@/graphQLData/discussion/mutations";

type EmojiVoteInput = {
  commentId?: string;
  discussionChannelId?: string;
  emojiLabel: string;
  unicode: string;
  username: string;
};

export default defineComponent({
  name: "EmojiButtons",
  components: {
    VoteButton,
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
  setup(props) {
    let emojiObject = {};

    if (props.emojiJson) {
      emojiObject = JSON.parse(props.emojiJson);
    }
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);
    const username = computed(() => {
      return localUsernameResult.value?.username || "";
    });

    // If a comment is being updated, use these mutations.
    const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);
    const { mutate: removeEmojiFromComment } = useMutation(
      REMOVE_EMOJI_FROM_COMMENT,
    );

    // If a discussionChannel is being updated, use these mutations.
    const { mutate: addEmojiToDiscussionChannel } = useMutation(
      ADD_EMOJI_TO_DISCUSSION_CHANNEL,
    );
    const { mutate: removeEmojiFromDiscussionChannel } = useMutation(
      REMOVE_EMOJI_FROM_DISCUSSION_CHANNEL,
    );

    return {
      addEmojiToComment,
      addEmojiToDiscussionChannel,
      emojiObject,
      removeEmojiFromComment,
      removeEmojiFromDiscussionChannel,
      username,
    };
  },
  methods: {
    isActive(emojiLabel: string) {
      let active = false;

      // @ts-ignore
      const variants = this.emojiObject[emojiLabel];
      for (const unicode in variants) {
        const usernames = variants[unicode];
        if (usernames.includes(this.username)) {
          active = true;
        }
      }

      return active;
    },
    toggleCommentEmoji(emojiVoteInput: EmojiVoteInput) {
      if (this.isActive(emojiVoteInput.emojiLabel)) {
        this.removeEmojiFromComment(emojiVoteInput);
        return;
      }
      this.addEmojiToComment(emojiVoteInput);
    },
    toggleDiscussionChannelEmoji(emojiVoteInput: EmojiVoteInput) {
      if (this.isActive(emojiVoteInput.emojiLabel)) {
        this.removeEmojiFromDiscussionChannel(emojiVoteInput);
        return;
      }
      this.addEmojiToDiscussionChannel(emojiVoteInput);
    },
    getCount(emojiLabel: string) {
      let sumUsernames = 0;
      for (const unicode in this.emojiObject[emojiLabel]) {
        const usernames = this.emojiObject[emojiLabel][unicode];
        // Key is a unicode variant. For example,
        // for a wave emoji, there could be several
        // variants, one for each skin tone.
        // The value should be an array of usernames.
        // For each variant, increment the sum by
        // the number of usernames.
        sumUsernames += usernames.length;
      }
      return sumUsernames;
    },
    getTooltipText(emojiLabel: any) {
      const count = this.getCount(emojiLabel);
      let tooltipText = "";
      let numListedNames = 0;
      let usernames: string[] = [];

      for (const unicode in this.emojiObject[emojiLabel]) {
        usernames = usernames.concat(this.emojiObject[emojiLabel][unicode]);
        tooltipText = usernames.slice(0, 5).join(", ");
        numListedNames = usernames.length;

        // If there's a lot of usernames, we don't want to list
        // all of them.
        // The count is the total number of usernames.
        // If there are more than 5 usernames, we'll list
        // the first 5, then say "and x more".
        if (numListedNames >= 5 && count > 5) {
          tooltipText += ` and ${count - 5} more`;
        }
      }
      tooltipText += ` reacted with :${emojiLabel}:
      `;
      return tooltipText;
    },
    getVariants(emojiLabel: string) {
      let variants = this.emojiObject[emojiLabel];

      if (!variants) {
        variants = {};
      }
      return variants;
    },
    getDefaultVariant(emojiLabel: string) {
      const variants = this.getVariants(emojiLabel);
      const defaultVariant = Object.keys(variants)[0];
      return defaultVariant;
    },
  },
});
</script>
<template>
  <div class="flex flex-wrap gap-1">
    <div
      v-for="emojiLabel in Object.keys(emojiObject)"
      :key="emojiLabel"
    >
      <VoteButton
        class="space-x-2"
        :active="isActive(emojiLabel)"
        :test-id="'upvote-emoji-button'"
        :show-count="true"
        :count="getCount(emojiLabel)"
        :tooltip-unicode="getDefaultVariant(emojiLabel)"
        :tooltip-text="getTooltipText(emojiLabel)"
        @vote="
          () => {
            if (commentId) {
              toggleCommentEmoji({
                emojiLabel,
                unicode: getDefaultVariant(emojiLabel),
                username: username,
                commentId: commentId,
              });
            }
            if (discussionChannelId) {
              toggleDiscussionChannelEmoji({
                discussionChannelId: discussionChannelId,
                emojiLabel,
                unicode: getDefaultVariant(emojiLabel),
                username: username,
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
