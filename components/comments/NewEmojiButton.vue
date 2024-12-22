<script lang="ts" setup>
import { ref } from "vue";
import VoteButton from "@/components/VoteButton.vue";
import FloatingDropdown from "@/components/FloatingDropdown.vue";
import EmojiPicker from "@/components/comments/EmojiPicker.vue";

defineProps({
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

const showMenu = ref(false);

const emit = defineEmits(["toggleEmojiPicker"]);

function handleClick() {
  emit("toggleEmojiPicker");
}
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
          :is-permalinked="isPermalinked"
          @vote="handleClick"
        >
          <i class="fa-regular fa-face-smile" />
        </VoteButton>
      </template>
      <template #content>
        <client-only>
          <EmojiPicker
            :discussion-channel-id="discussionChannelId"
            :comment-id="commentId"
            :emoji-json="emojiJson"
            @emoji-click="showMenu = false"
            @close="showMenu = false"
          />
        </client-only>
      </template>
    </FloatingDropdown>
  </div>
</template>
