<script lang="ts" setup>
import { ref } from 'vue';
import VoteButton from '@/components/VoteButton.vue';
import FloatingDropdown from '@/components/FloatingDropdown.vue';
import EmojiPicker from '@/components/comments/EmojiPicker.vue';

const props = defineProps({
  commentId: {
    type: String,
    required: false,
    default: '',
  },
  discussionChannelId: {
    type: String,
    required: false,
    default: '',
  },
  emojiJson: {
    type: String,
    required: false,
    default: '',
  },
  isPermalinked: {
    type: Boolean,
    required: false,
    default: false,
  },
  isMarkedAsAnswer: {
    type: Boolean,
    required: false,
    default: false,
  },
  interactionDisabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  disabledTooltipText: {
    type: String,
    required: false,
    default: 'You are suspended in this forum and cannot react.',
  },
});

const showMenu = ref(false);

const emit = defineEmits(['toggleEmojiPicker', 'blocked-action']);

function handleClick() {
  if (props.interactionDisabled) {
    showMenu.value = false;
    emit('blocked-action');
    return;
  }
  emit('toggleEmojiPicker');
}
</script>

<template>
  <div class="w-fit">
    <FloatingDropdown v-model="showMenu">
      <template #button="{ activatorProps }">
        <VoteButton
          :class="
            props.interactionDisabled ? 'space-x-3 opacity-60' : 'space-x-3'
          "
          :button-props="
            props.interactionDisabled
              ? { ...activatorProps, 'aria-disabled': 'true' }
              : activatorProps
          "
          :test-id="'emoji-button'"
          :show-count="false"
          :tooltip-text="
            props.interactionDisabled
              ? props.disabledTooltipText
              : 'Add reaction...'
          "
          :is-permalinked="isPermalinked"
          :is-marked-as-answer="isMarkedAsAnswer"
          @vote="handleClick"
        >
          <span class="flex items-center gap-1">
            <i class="fa-regular fa-face-smile" aria-hidden="true" />
            <span class="text-xs">React</span>
          </span>
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
