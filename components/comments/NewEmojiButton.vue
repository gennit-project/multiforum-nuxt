<script lang="ts">
import { defineComponent, ref } from "vue";
import VoteButton from "@/components/VoteButton.vue";
import FloatingDropdown from "../FloatingDropdown.vue";
import EmojiPicker from "./EmojiPicker.vue";

export default defineComponent({
  name: "NewEmojiButton",
  components: {
    EmojiPicker,
    FloatingDropdown,
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
  setup() {

    return {
      showMenu: ref(false),
    };
  },
  methods: {
    handleClick() {
      this.$emit("toggleEmojiPicker");
    },
  },
});
</script>

<template>
  <div class="w-fit">
    <FloatingDropdown v-model="showMenu">
      <template #button>
        <VoteButton
          class="space-x-3"
          :test-id="'emoji-button'"
          :show-count="false"
          :tooltip-text="'Add reaction...'"
          @vote="handleClick"
        >
          <i class="fa-regular fa-face-smile" />
        </VoteButton>
      </template>
      <template #content>
        <EmojiPicker
          :discussion-channel-id="discussionChannelId"
          :comment-id="commentId"
          :emoji-json="emojiJson"
          @emojiClick="showMenu = false"
          @close="showMenu = false"
        />
      </template>
    </FloatingDropdown>
  </div>
</template>
