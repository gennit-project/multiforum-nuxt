<script setup lang="ts">
import {
  ref,
  nextTick,
  onMounted,
  onBeforeUnmount,
  computed,
  toRef,
} from 'vue';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue';
import { useDisplay } from 'vuetify';

// Components
import AddImage from '@/components/AddImage.vue';
import ErrorBanner from './ErrorBanner.vue';
import CharCounter from '@/components/CharCounter.vue';
import TextEditorToolbar from '@/components/text-editor/TextEditorToolbar.vue';
import TextEditorFullScreen from '@/components/text-editor/TextEditorFullScreen.vue';
import EmojiPickerWrapper from '@/components/text-editor/EmojiPickerWrapper.vue';
import BotSuggestionsPopover from '@/components/text-editor/BotSuggestionsPopover.vue';

// Composables
import { useImageUpload } from '@/composables/useImageUpload';
import {
  useEmojiPicker,
  type EmojiClickEvent,
} from '@/composables/useEmojiPicker';
import { useBotAutocomplete } from '@/composables/useBotAutocomplete';
import { useFullScreenEditor } from '@/composables/useFullScreenEditor';

// Utils
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';
import { formatText, type FormatType } from '@/utils/textFormatting';
import type { BotSuggestion } from '@/utils/botMentions';

type FileChangeInput = {
  event: Event & { target: HTMLInputElement | null };
  fieldName: string;
};

// Props
const props = defineProps({
  allowImageUpload: {
    type: Boolean,
    default: true,
  },
  disableAutoFocus: {
    type: Boolean,
    default: false,
  },
  initialValue: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: 'texteditor-textarea',
  },
  placeholder: {
    type: String,
    default: 'Write your comment here...',
  },
  rows: {
    type: Number,
    default: 4,
  },
  showCharCounter: {
    type: Boolean,
    default: false,
  },
  maxChars: {
    type: Number,
    default: MAX_CHARS_IN_COMMENT,
  },
  fieldName: {
    type: String,
    default: '',
  },
  enableBotAutocomplete: {
    type: Boolean,
    default: false,
  },
  botSuggestions: {
    type: Array as () => BotSuggestion[],
    default: () => [],
  },
  ariaLabel: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update']);

// Core state
const editorRef = ref<HTMLTextAreaElement | null>(null);
const text = ref(props.initialValue);
const cursorIndex = ref(0);
const selectedTab = ref(0);

// Computed
const accessibleLabel = computed(() => {
  return props.ariaLabel || props.placeholder || 'Text editor';
});

const { width } = useDisplay();
const isSmallScreen = computed(() => width.value < 640);

// Initialize composables
const {
  uploadFile,
  validateFileSize,
  createUploadPlaceholder,
  createImageMarkdown,
  createErrorMarkdown,
  createPlaceholderRegex,
  createSignedStorageUrlError,
} = useImageUpload();

const {
  showEmojiPicker,
  emojiPickerPosition,
  toggleEmojiPicker,
  closeEmojiPicker,
  insertEmoji: insertEmojiFromPicker,
} = useEmojiPicker();

// Bot autocomplete composable with getter functions for proper reactivity
const {
  showBotSuggestions,
  showBotHelperText,
  filteredBotSuggestions,
  suggestionPopoverStyle,
  updateCaretCoordinates,
  applyBotSuggestion,
} = useBotAutocomplete({
  getText: () => text.value,
  getCursorIndex: () => cursorIndex.value,
  isEnabled: () => props.enableBotAutocomplete,
  getBotSuggestions: () => props.botSuggestions,
  getEditorRef: () => editorRef.value,
  getIsSmallScreen: () => isSmallScreen.value,
  onUpdate: updateText,
  onCursorUpdate: (index: number) => {
    cursorIndex.value = index;
  },
});

// Full-screen editor composable
const { isFullScreen, showFormatted, toggleFullScreen, exitFullScreen } =
  useFullScreenEditor({
    editorRef,
    disableAutoFocus: toRef(props, 'disableAutoFocus'),
  });

// Methods
function updateText(newText: string) {
  text.value = newText;
  emit('update', newText);
}

function focusEditor() {
  nextTick(() => {
    if (editorRef.value && !props.disableAutoFocus) {
      editorRef.value.focus();
    }
  });
}

function updateCursorIndex(event: Event) {
  const target = event.target as HTMLTextAreaElement | null;
  if (!target) return;
  cursorIndex.value = target.selectionStart ?? 0;
  // Only update caret coordinates when bot autocomplete is active
  if (props.enableBotAutocomplete && props.botSuggestions.length > 0) {
    nextTick(() => {
      updateCaretCoordinates();
    });
  }
}

function handleEditorInput(event: Event) {
  const target = event.target as HTMLTextAreaElement | null;
  if (!target) return;
  updateText(target.value);
  updateCursorIndex(event);
}

function handleEmojiClick(event: EmojiClickEvent) {
  const textarea = editorRef.value;
  if (!textarea) return;

  insertEmojiFromPicker({
    event,
    textarea,
    onUpdate: updateText,
  });
}

function formatTextArea(format: string) {
  const textarea = editorRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  const formattedText = formatText({
    text: selectedText,
    format: format as FormatType,
  });

  textarea.setRangeText(formattedText, start, end, 'end');
  updateText(textarea.value);
}

// Image upload handling
async function handleFormStateDuringUpload(file: File) {
  const textarea = editorRef.value;
  if (!textarea) return;

  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return;
  }

  const cursorPositionStart = textarea.selectionStart;
  const cursorPositionEnd = textarea.selectionEnd;

  const uploadId = Date.now().toString();
  const { markdown: markdownLink, placeholderText } = createUploadPlaceholder(
    file,
    uploadId
  );

  // Insert placeholder
  textarea.setRangeText(
    markdownLink,
    cursorPositionStart,
    cursorPositionEnd,
    'end'
  );
  text.value = textarea.value;

  const placeholderStart = cursorPositionStart;
  const placeholderEnd = placeholderStart + markdownLink.length;

  try {
    const result = await uploadFile(file);

    if (!result.success || !result.embeddedLink) {
      const errorMarkdown = createErrorMarkdown(
        file.name,
        result.error || 'Failed to upload'
      );
      replaceTextRange(
        textarea,
        placeholderStart,
        placeholderEnd,
        errorMarkdown
      );
      return;
    }

    // Check if placeholder still exists
    const placeholderIdentifier = `${placeholderText} (id:${uploadId})`;
    const placeholderRegex = createPlaceholderRegex(placeholderText, uploadId);

    if (textarea.value.indexOf(placeholderIdentifier) === -1) {
      // Try to find using regex
      const matches = textarea.value.match(placeholderRegex);
      if (matches && matches.length > 0) {
        const newMarkdown = createImageMarkdown(file.name, result.embeddedLink);
        const newText = textarea.value.replace(placeholderRegex, newMarkdown);
        updateTextareaAndModel(textarea, newText);
        return;
      }

      // Append at end
      const newMarkdown = createImageMarkdown(file.name, result.embeddedLink);
      updateTextareaAndModel(textarea, textarea.value + '\n' + newMarkdown);
      return;
    }

    // Replace placeholder with actual image
    const newMarkdown = createImageMarkdown(file.name, result.embeddedLink);
    replaceTextRange(textarea, placeholderStart, placeholderEnd, newMarkdown);
    textarea.setSelectionRange(
      placeholderStart + newMarkdown.length,
      placeholderStart + newMarkdown.length
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorMarkdown = createErrorMarkdown(file.name, errorMessage);

    const placeholderRegex = createPlaceholderRegex(placeholderText, uploadId);
    if (textarea.value.match(placeholderRegex)) {
      const newText = textarea.value.replace(placeholderRegex, errorMarkdown);
      updateTextareaAndModel(textarea, newText);
    } else {
      replaceTextRange(
        textarea,
        placeholderStart,
        placeholderEnd,
        errorMarkdown
      );
    }
  }
}

function replaceTextRange(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string
) {
  const newText =
    textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
  updateTextareaAndModel(textarea, newText);
}

function updateTextareaAndModel(
  textarea: HTMLTextAreaElement,
  newText: string
) {
  text.value = newText;
  textarea.value = newText;
  emit('update', text.value);
}

async function handlePaste(event: ClipboardEvent) {
  if (!props.allowImageUpload) return;

  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        await handleFormStateDuringUpload(file);
      }
    }
  }
}

async function handleFileChange(input: FileChangeInput) {
  if (!props.allowImageUpload) return;
  if (!input.event.target?.files) return;

  const selectedFile = input.event.target.files[0];
  if (selectedFile) {
    await handleFormStateDuringUpload(selectedFile);
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (!props.allowImageUpload) return;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (file) {
    await handleFormStateDuringUpload(file);
  }
}

// Tab handling
function handleWriteTabClick() {
  showFormatted.value = false;
  selectedTab.value = 0;
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus();
    }
  });
}

function handlePreviewTabClick() {
  showFormatted.value = true;
  selectedTab.value = 1;
}

// Lifecycle hooks
onMounted(() => {
  if (!props.disableAutoFocus) {
    focusEditor();
  }
});

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.addEventListener('paste', handlePaste);
  }
});

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.removeEventListener('paste', handlePaste);
  }
});

onMounted(() => {
  window.addEventListener('resize', updateCaretCoordinates);
  updateCaretCoordinates();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCaretCoordinates);
});

const markdownDocsLink = 'https://www.markdownguide.org/basic-syntax/';
</script>

<template>
  <div>
    <!-- Full-screen overlay -->
    <TextEditorFullScreen
      v-if="isFullScreen"
      :text="text"
      :placeholder="props.placeholder"
      :test-id="props.testId"
      :accessible-label="accessibleLabel"
      :allow-image-upload="props.allowImageUpload"
      :field-name="props.fieldName"
      :show-emoji-picker="showEmojiPicker"
      :emoji-picker-position="emojiPickerPosition"
      @exit="exitFullScreen"
      @input="handleEditorInput"
      @click="updateCursorIndex"
      @keyup="updateCursorIndex"
      @drop="handleDrop"
      @format="formatTextArea"
      @toggle-emoji="toggleEmojiPicker"
      @emoji-click="handleEmojiClick"
      @close-emoji="closeEmojiPicker"
      @file-change="handleFileChange"
    />

    <!-- Regular editor form -->
    <form v-else class="relative rounded-md border p-2 dark:border-gray-600">
      <ErrorBanner
        v-if="createSignedStorageUrlError"
        :text="createSignedStorageUrlError.message"
      />

      <EmojiPickerWrapper
        v-if="showEmojiPicker"
        :position="emojiPickerPosition"
        @emoji-click="handleEmojiClick"
        @close="closeEmojiPicker"
      />

      <TabGroup as="div">
        <div
          class="border-b pb-2 dark:border-gray-600 sm:flex-wrap md:flex md:justify-between"
        >
          <TabList class="flex items-center">
            <Tab
              as="button"
              :class="[
                selectedTab === 0
                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100'
                  : 'bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-300',
                'border-transparent mr-2 rounded-md px-3 py-1.5 text-sm font-medium',
              ]"
              @click="handleWriteTabClick"
            >
              Write
            </Tab>
            <Tab
              as="button"
              :class="[
                selectedTab === 1
                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100'
                  : 'bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-300',
                'border-transparent rounded-md px-3 py-1.5 text-sm font-medium',
              ]"
              @click="handlePreviewTabClick"
            >
              Preview
            </Tab>
          </TabList>

          <TextEditorToolbar
            v-if="!showFormatted"
            :show-fullscreen-button="true"
            @format="formatTextArea"
            @toggle-emoji="toggleEmojiPicker"
            @toggle-fullscreen="toggleFullScreen"
          />
        </div>

        <TabPanels class="mt-2">
          <TabPanel class="-m-0.5 rounded-md px-0.5 py-1">
            <textarea
              ref="editorRef"
              :data-testid="props.testId"
              :aria-label="accessibleLabel"
              :rows="props.rows"
              :placeholder="props.placeholder"
              class="block w-full rounded-md border border-gray-200 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              :value="text"
              @input="handleEditorInput"
              @click="updateCursorIndex"
              @keyup="updateCursorIndex"
              @dragover.prevent
              @drop="handleDrop"
            />

            <BotSuggestionsPopover
              v-if="showBotSuggestions"
              :suggestions="filteredBotSuggestions"
              :style="suggestionPopoverStyle"
              @select="applyBotSuggestion"
            />

            <div class="mt-2 flex-col divide-gray-400 dark:divide-gray-300">
              <p
                v-if="showBotHelperText"
                class="text-xs text-gray-500 dark:text-gray-300"
              >
                Type <span class="font-mono">/bots/</span> or <span class="font-mono">/bot/</span> to see available bots.
              </p>
              <a
                target="_blank"
                :href="markdownDocsLink"
                class="text-sm text-gray-600 hover:underline dark:text-gray-300"
              >
                Markdown is supported
              </a>
              <AddImage
                v-if="props.allowImageUpload"
                label="Paste, drop, or click to add files"
                :field-name="fieldName"
                @file-change="handleFileChange"
              />
            </div>
          </TabPanel>

          <TabPanel class="-m-0.5 overflow-auto rounded-md p-0.5">
            <MarkdownRenderer
              :text="text"
              class="block w-full max-w-2xl rounded-md border-gray-300 text-xs shadow-sm dark:border-gray-800 dark:bg-gray-700 dark:text-gray-100"
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <CharCounter
        v-if="showCharCounter"
        :key="text.length"
        :current="text.length || 0"
        :max="maxChars"
      />
    </form>
  </div>
</template>

<style lang="scss">
@media (prefers-color-scheme: dark) {
  .dark {
    table,
    thead,
    tbody,
    th,
    td {
      background-color: black !important;
    }
  }
}

img {
  max-width: 100% !important;
  height: auto !important;
  width: auto !important;
  object-fit: contain !important;
}
</style>
