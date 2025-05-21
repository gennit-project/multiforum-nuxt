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
          :is-permalinked="isPermalinked"
          :show-count="false"
          :test-id="'emoji-button'"
          :tooltip-text="'Add reaction...'"
          @vote="handleClick"
        >
          <i class="fa-regular fa-face-smile" />
        </VoteButton>
      </template>
      <template #content>
        <client-only>
          <EmojiPicker
            :comment-id="commentId"
            :discussion-channel-id="discussionChannelId"
            :emoji-json="emojiJson"
            @close="showMenu = false"
            @emoji-click="showMenu = false"
          />
        </client-only>
      </template>
    </FloatingDropdown>
  </div>
</template>
