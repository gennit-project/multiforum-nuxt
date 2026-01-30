<script setup lang="ts">
import EmojiPicker from '@/components/comments/EmojiPicker.vue';
import type { EmojiClickEvent } from '@/composables/useEmojiPicker';

defineProps<{
  position: { top: string; left: string };
}>();

const emit = defineEmits<{
  'emoji-click': [event: EmojiClickEvent];
  close: [];
}>();
</script>

<template>
  <div
    class="absolute z-50"
    :style="{
      top: position.top,
      left: position.left,
    }"
  >
    <div class="relative">
      <EmojiPicker
        @emoji-click="(e: EmojiClickEvent) => emit('emoji-click', e)"
        @close="emit('close')"
      />
    </div>
  </div>
</template>
