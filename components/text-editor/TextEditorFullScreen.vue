<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import TextEditorToolbar from './TextEditorToolbar.vue';
import AddImage from '@/components/AddImage.vue';
import type { EmojiClickEvent } from '@/composables/useEmojiPicker';

// Lazy-loaded components (heavy dependencies)
const EmojiPickerWrapper = defineAsyncComponent(
  () => import('./EmojiPickerWrapper.vue')
);
const MarkdownRenderer = defineAsyncComponent(
  () => import('@/components/MarkdownRenderer.vue')
);

type FileChangeInput = {
  event: Event & { target: HTMLInputElement | null };
  fieldName: string;
};

defineProps<{
  text: string;
  placeholder: string;
  testId: string;
  accessibleLabel: string;
  allowImageUpload: boolean;
  fieldName: string;
  showEmojiPicker: boolean;
  emojiPickerPosition: { top: string; left: string };
}>();

const emit = defineEmits<{
  exit: [];
  input: [event: Event];
  click: [event: Event];
  keyup: [event: Event];
  drop: [event: DragEvent];
  format: [format: string];
  'toggle-emoji': [event: MouseEvent];
  'emoji-click': [event: EmojiClickEvent];
  'close-emoji': [];
  'file-change': [input: FileChangeInput];
}>();

const markdownDocsLink = 'https://www.markdownguide.org/basic-syntax/';
</script>

<template>
  <div class="fixed inset-0 z-50 bg-white dark:bg-gray-900">
    <!-- Emoji picker for full-screen -->
    <EmojiPickerWrapper
      v-if="showEmojiPicker"
      :position="emojiPickerPosition"
      @emoji-click="(e) => emit('emoji-click', e)"
      @close="emit('close-emoji')"
    />

    <!-- Full-screen header -->
    <div
      class="flex items-center justify-between border-b p-4 dark:border-gray-600"
    >
      <h2 class="text-lg font-medium dark:text-white">Full Screen Editor</h2>
      <button
        type="button"
        aria-label="Exit full screen"
        class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        @click="emit('exit')"
      >
        <i class="fas fa-times text-xl" aria-hidden="true" />
      </button>
    </div>

    <!-- Full-screen content -->
    <div class="flex flex-col md:flex-row" style="height: calc(100vh - 4rem)">
      <!-- Editor side -->
      <div
        class="flex h-1/2 flex-1 flex-col border-r dark:border-gray-600 md:h-full"
      >
        <div class="border-b p-4 dark:border-gray-600">
          <h3 class="text-md mb-2 font-medium dark:text-white">
            Markdown Editor
          </h3>
          <TextEditorToolbar
            :show-fullscreen-button="false"
            @format="(f) => emit('format', f)"
            @toggle-emoji="(e) => emit('toggle-emoji', e)"
          />
        </div>
        <div class="flex flex-1 flex-col p-4">
          <textarea
            :data-testid="testId + '-fullscreen'"
            :aria-label="accessibleLabel"
            class="mb-2 w-full flex-1 resize-none rounded-md border border-gray-200 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            :value="text"
            :placeholder="placeholder"
            @input="(e) => emit('input', e)"
            @click="(e) => emit('click', e)"
            @keyup="(e) => emit('keyup', e)"
            @dragover.prevent
            @drop="(e) => emit('drop', e)"
          />
          <div class="flex-col divide-gray-400 dark:divide-gray-300">
            <a
              target="_blank"
              :href="markdownDocsLink"
              class="text-sm text-gray-600 hover:underline dark:text-gray-300"
            >
              Markdown is supported
            </a>
            <AddImage
              v-if="allowImageUpload"
              label="Paste, drop, or click to add files"
              :field-name="fieldName"
              @file-change="(input: FileChangeInput) => emit('file-change', input)"
            />
          </div>
        </div>
      </div>

      <!-- Preview side -->
      <div class="flex h-1/2 flex-1 flex-col md:h-full">
        <div class="border-b p-4 dark:border-gray-600">
          <h3 class="text-md font-medium dark:text-white">Preview</h3>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <MarkdownRenderer
            :text="text"
            class="prose prose-sm max-w-none dark:prose-invert"
          />
        </div>
      </div>
    </div>
  </div>
</template>
