<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import AddImage from '@/components/AddImage.vue';
import { uploadAndGetEmbeddedLink, getUploadFileName } from '@/utils';
import ErrorBanner from './ErrorBanner.vue';
import { usernameVar } from '@/cache';
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';
import { isFileSizeValid } from '@/utils/index';
import EmojiPicker from '@/components/comments/EmojiPicker.vue';
import EyeSlashIcon from '@/components/icons/EyeSlashIcon.vue';
import CharCounter from '@/components/CharCounter.vue';
import {
  formatText,
  insertEmoji as insertEmojiAtPosition,
  type FormatType,
} from '@/utils/textFormatting';
import {
  getBotMentionState,
  filterBotSuggestions,
} from '@/utils/botMentions';

type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event & { target: HTMLInputElement | null };
  fieldName: string;
};

type EmojiClickEvent = {
  unicode: string;
};

type BotSuggestion = {
  value: string;
  label: string;
  isDeprecated?: boolean;
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
  // Accessibility props
  ariaLabel: {
    type: String,
    default: '',
  },
});
const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
  useMutation(CREATE_SIGNED_STORAGE_URL);

// Compute accessible label - use ariaLabel if provided, otherwise fall back to placeholder
const accessibleLabel = computed(() => {
  return props.ariaLabel || props.placeholder || 'Text editor';
});

// Refs
const editorRef = ref<HTMLTextAreaElement | null>(null);
const text = ref(props.initialValue);
const showFormatted = ref(false);
const showEmojiPicker = ref(false);
const emojiPickerPosition = ref({ top: '0px', left: '0px' });
const isFullScreen = ref(false);
const cursorIndex = ref(0);

// Methods
const focusEditor = () => {
  nextTick(() => {
    if (editorRef.value && !props.disableAutoFocus) {
      editorRef.value.focus();
    }
  });
};

const emit = defineEmits(['update']);

const updateText = (newText: string) => {
  text.value = newText;
  emit('update', newText);
};

const updateCursorIndex = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | null;
  if (!target) return;
  cursorIndex.value = target.selectionStart ?? 0;
};

const handleEditorInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | null;
  if (!target) return;
  updateText(target.value);
  updateCursorIndex(event);
};

const insertEmoji = (event: EmojiClickEvent) => {
  const textarea = editorRef.value;
  if (!textarea) return;

  // Extract the unicode emoji character from the event
  const emojiChar = event?.unicode || '';

  if (!emojiChar) {
    console.error('Could not extract emoji from event:', event);
    return;
  }

  const cursorPositionStart = textarea.selectionStart;

  // Use the insertEmoji utility
  const newText = insertEmojiAtPosition({
    text: textarea.value,
    position: cursorPositionStart,
    emoji: emojiChar,
  });

  // Update textarea value
  textarea.value = newText;

  // Set cursor position after the emoji
  textarea.selectionStart = cursorPositionStart + emojiChar.length;
  textarea.selectionEnd = cursorPositionStart + emojiChar.length;

  // Update model and close picker
  updateText(textarea.value);
  showEmojiPicker.value = false;

  // Focus back on textarea
  textarea.focus();
};

const toggleEmojiPicker = (event: MouseEvent) => {
  const buttonElement = event.currentTarget as HTMLElement;
  const offsetParent = buttonElement.offsetParent as HTMLElement | null;

  // Calculate initial position below the button
  const top = buttonElement.offsetTop + buttonElement.offsetHeight;
  let left = buttonElement.offsetLeft;

  // Check if the picker would overflow the right edge of the viewport
  // Emoji picker is approximately 350px wide
  const EMOJI_PICKER_WIDTH = 350;
  const containerWidth = offsetParent?.clientWidth || window.innerWidth;
  const rightEdge = left + EMOJI_PICKER_WIDTH;

  // If the picker would overflow, align it to the right edge instead
  if (rightEdge > containerWidth) {
    // Position it so the right edge aligns with the viewport, with some padding
    left = Math.max(0, containerWidth - EMOJI_PICKER_WIDTH - 16);
  }

  // Position emoji picker below the button, adjusted for viewport constraints
  emojiPickerPosition.value = {
    top: `${top}px`,
    left: `${left}px`,
  };

  showEmojiPicker.value = !showEmojiPicker.value;
};

const formatTextArea = (format: string) => {
  const textarea = editorRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  // Use the format utility with the correct format type
  const formattedText = formatText({
    text: selectedText,
    format: format as FormatType,
  });

  textarea.setRangeText(formattedText, start, end, 'end');
  updateText(textarea.value);
};

const mentionState = computed(() =>
  getBotMentionState(text.value || '', cursorIndex.value)
);

const filteredBotSuggestions = computed(() => {
  if (!props.enableBotAutocomplete || props.botSuggestions.length === 0) {
    return [];
  }
  const state = mentionState.value;
  if (!state) return [];
  return filterBotSuggestions(
    props.botSuggestions.filter((bot) => !bot.isDeprecated),
    state.query
  );
});

const showBotSuggestions = computed(() => {
  return props.enableBotAutocomplete && filteredBotSuggestions.value.length > 0;
});

const applyBotSuggestion = (suggestion: BotSuggestion) => {
  const state = mentionState.value;
  const textarea = editorRef.value;
  if (!state || !textarea) return;

  const before = text.value.slice(0, state.triggerIndex);
  const after = text.value.slice(cursorIndex.value);
  const insertion = `/bot/${suggestion.value}`;
  const needsSpace = after.length > 0 && !after.startsWith(' ');
  const nextText = `${before}${insertion}${needsSpace ? ' ' : ''}${after}`;

  updateText(nextText);
  textarea.value = nextText;
  const nextCursor = before.length + insertion.length + (needsSpace ? 1 : 0);
  textarea.setSelectionRange(nextCursor, nextCursor);
  cursorIndex.value = nextCursor;
  textarea.focus();
};

const handlePaste = async (event: ClipboardEvent) => {
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
};

const handleFormStateDuringUpload = async (file: File) => {
  const textarea = editorRef.value;
  if (!textarea) return;
  const sizeCheck = isFileSizeValid({ file });
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return;
  }

  const cursorPositionStart = textarea.selectionStart;
  const cursorPositionEnd = textarea.selectionEnd;

  // Generate unique ID for this upload to help with tracking/replacing the placeholder
  const uploadId = Date.now().toString();
  const placeholderText = `Uploading image...`;

  // Make the placeholder clearer for mobile users
  const safeFileName = file.name.replace(/[^\w\s.-]/g, '_');
  const markdownLink = `![${safeFileName}](${placeholderText} (id:${uploadId}))`;

  textarea.setRangeText(
    markdownLink,
    cursorPositionStart,
    cursorPositionEnd,
    'end'
  );
  text.value = textarea.value;
  textarea.value = text.value; // Ensure textarea is synced

  // Store the placeholder position information
  const placeholderStart = cursorPositionStart;
  const placeholderEnd = placeholderStart + markdownLink.length;

  try {
    const embeddedLink = await upload(file);
    if (!embeddedLink) {
      // Handle upload failure by modifying the placeholder
      const errorMarkdownLink = `![Upload failed: ${file.name}](Error: Failed to fetch)`;
      const newText =
        textarea.value.slice(0, placeholderStart) +
        errorMarkdownLink +
        textarea.value.slice(placeholderEnd);

      text.value = newText;
      textarea.value = newText;
      emit('update', text.value);
      return;
    }

    // Check if the textarea content still contains our placeholder with the unique ID
    // This ensures we're replacing the correct placeholder even if the user edited meanwhile
    const placeholderIdentifier = `${placeholderText} (id:${uploadId})`;
    const placeholderRegex = new RegExp(
      `!\\[.*?\\]\\(${placeholderText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(id:${uploadId}\\)\\)`,
      'g'
    );

    if (textarea.value.indexOf(placeholderIdentifier) === -1) {
      console.warn('Upload completed but placeholder was modified or removed');

      // Try to find using regex in case just parts were modified
      const matches = textarea.value.match(placeholderRegex);
      if (matches && matches.length > 0) {
        // Found via regex, so replace it
        const safeFileName = file.name.replace(/[^\w\s.-]/g, '_');
        const newMarkdownLink = `![${safeFileName}](${embeddedLink})`;
        const newText = textarea.value.replace(
          placeholderRegex,
          newMarkdownLink
        );
        textarea.value = newText;
        text.value = newText;
        emit('update', text.value);
        return;
      }

      // If regex didn't match either, append at end
      const newMarkdownLink = `![${file.name}](${embeddedLink})`;
      textarea.value = textarea.value + '\n' + newMarkdownLink;
      text.value = textarea.value;
      emit('update', text.value);
      return;
    }

    // Replace the placeholder with the actual image markdown
    const safeFileName = file.name.replace(/[^\w\s.-]/g, '_');
    const newMarkdownLink = `![${safeFileName}](${embeddedLink})`;
    const newText =
      textarea.value.slice(0, placeholderStart) +
      newMarkdownLink +
      textarea.value.slice(placeholderEnd);

    text.value = newText;
    textarea.value = newText;
    textarea.setSelectionRange(
      placeholderStart + newMarkdownLink.length,
      placeholderStart + newMarkdownLink.length
    );
    emit('update', text.value);
  } catch (error) {
    console.error('Error during upload:', error);

    // Try to find the placeholder using regex
    const placeholderRegex = new RegExp(
      `!\\[.*?\\]\\(${placeholderText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(id:${uploadId}\\)\\)`,
      'g'
    );

    let newText = '';
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const safeFileName = file.name.replace(/[^\w\s.-]/g, '_');
    const errorMarkdownLink = `![Upload failed: ${safeFileName}](Error: ${errorMessage.substring(0, 50)})`;

    if (textarea.value.match(placeholderRegex)) {
      // Placeholder found with regex
      newText = textarea.value.replace(placeholderRegex, errorMarkdownLink);
    } else if (textarea.value.indexOf(placeholderText) !== -1) {
      // Try simpler search
      const simpleRegex = new RegExp(
        `!\\[.*?\\]\\(${placeholderText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?\\)`,
        'g'
      );
      newText = textarea.value.replace(simpleRegex, errorMarkdownLink);
    } else {
      // Fallback to original position-based replacement
      newText =
        textarea.value.slice(0, placeholderStart) +
        errorMarkdownLink +
        textarea.value.slice(placeholderEnd);
    }

    text.value = newText;
    textarea.value = newText;
    emit('update', text.value);
  }
};

const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error('No username found');
    throw new Error('Not logged in or username not found');
  }

  try {
    console.log(
      'Getting signed URL for',
      file.name,
      'size:',
      file.size,
      'type:',
      file.type
    );

    // For mobile devices, ensure the file type is correct even when it's sometimes missing
    const fileType =
      file.type || getFileTypeFromName(file.name) || 'image/jpeg';
    console.log('Using file type:', fileType);

    const filename = getUploadFileName({ username: usernameVar.value, file });
    const signedStorageURLInput = { filename, contentType: fileType };

    console.log(
      'Requesting signed URL with input:',
      JSON.stringify(signedStorageURLInput)
    );
    const signedUrlResult = await createSignedStorageUrl(signedStorageURLInput);
    console.log('Signed URL result received');

    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    if (!signedStorageURL) {
      throw new Error('Failed to get signed URL for upload');
    }

    // Log success of signed URL for debugging
    console.log(`Got signed URL successfully for ${filename}`);

    // Test the signed URL parameters
    const urlParts = signedStorageURL.split('?');
    console.log('URL base:', urlParts[0]);
    console.log('URL has params:', urlParts.length > 1);

    const embeddedLink = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType,
      signedStorageURL,
    });

    if (!embeddedLink) {
      throw new Error('Upload completed but no URL was returned');
    }

    // Log final success for debugging
    console.log(`Upload and link generation complete for ${filename}`);

    return embeddedLink;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error; // Re-throw to allow proper error handling in the calling function
  }
};

// Helper function to determine file type from name when mobile browsers don't provide it
const getFileTypeFromName = (filename: string): string | null => {
  if (!filename) return null;

  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return null;

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
  };

  return mimeTypes[extension] || null;
};

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

// Handle escape key to exit full-screen
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isFullScreen.value) {
    exitFullScreen();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Format buttons configuration
type FormatButton = {
  label: string;
  format: string;
  class?: string;
};

const formatButtons: FormatButton[] = [
  { label: 'B', format: 'bold' },
  { label: 'I', format: 'italic' },
  { label: 'U', format: 'underline' },
  { label: 'H1', format: 'header1' },
  { label: 'H2', format: 'header2' },
  { label: 'H3', format: 'header3' },
  { label: 'Quote', format: 'quote' },
  { label: 'spoiler', format: 'spoiler', class: 'line-through' },
  { label: 'Emoji', format: 'emoji' },
  { label: '⛶', format: 'fullscreen' },
];

const markdownDocsLink = 'https://www.markdownguide.org/basic-syntax/';

const handleFileChange = async (input: FileChangeInput) => {
  const { event } = input;
  if (!props.allowImageUpload) {
    return;
  }
  if (!event.target || !event.target.files) {
    return;
  }
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    await handleFormStateDuringUpload(selectedFile);
  }
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  if (!props.allowImageUpload) {
    return;
  }

  const files = event.dataTransfer?.files;

  if (!files || files.length === 0) {
    return;
  }

  // Assuming you want to handle only the first dropped file.
  const file = files[0];
  if (file) {
    handleFormStateDuringUpload(file);
  }
};

const selectedTab = ref(0);

// Close emoji picker when clicking outside
const closeEmojiPicker = () => {
  showEmojiPicker.value = false;
};

// Full-screen methods
const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
  // When entering full-screen, switch to split mode showing both editor and preview
  if (isFullScreen.value) {
    showFormatted.value = false; // Ensure we're in split mode, not just preview
    // Focus the textarea when entering full-screen mode
    nextTick(() => {
      if (editorRef.value && !props.disableAutoFocus) {
        editorRef.value.focus();
      }
    });
  }
};

const exitFullScreen = () => {
  isFullScreen.value = false;
};
</script>

<template>
  <div>
    <!-- Full-screen overlay -->
    <div
      v-if="isFullScreen"
      class="fixed inset-0 z-50 bg-white dark:bg-gray-900"
    >
      <!-- Emoji picker for full-screen -->
      <div
        v-if="showEmojiPicker"
        class="absolute z-50"
        :style="{
          top: emojiPickerPosition.top,
          left: emojiPickerPosition.left,
        }"
      >
        <div class="relative">
          <EmojiPicker @emoji-click="insertEmoji" @close="closeEmojiPicker" />
        </div>
      </div>
      <!-- Full-screen header -->
      <div
        class="flex items-center justify-between border-b p-4 dark:border-gray-600"
      >
        <h2 class="text-lg font-medium dark:text-white">Full Screen Editor</h2>
        <button
          type="button"
          aria-label="Exit full screen"
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="exitFullScreen"
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
            <!-- Format buttons for full-screen -->
            <div class="flex flex-wrap items-center space-x-1">
              <button
                v-for="button in formatButtons.filter(
                  (b) => b.format !== 'fullscreen'
                )"
                :key="button.label"
                type="button"
                :aria-label="button.label"
                :class="[
                  'border-transparent text-md rounded-md px-2 py-1 font-medium hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                  button.class,
                ]"
                @click.prevent="
                  button.format === 'emoji'
                    ? toggleEmojiPicker($event)
                    : formatTextArea(button.format)
                "
              >
                <EyeSlashIcon
                  v-if="button.format === 'spoiler'"
                  class="h-4 w-4"
                  aria-hidden="true"
                />
                <span v-else>{{ button.label }}</span>
              </button>
            </div>
          </div>
          <div class="flex flex-1 flex-col p-4">
            <textarea
              ref="editorRef"
              :data-testid="props.testId + '-fullscreen'"
              :aria-label="accessibleLabel"
              class="mb-2 w-full flex-1 resize-none rounded-md border border-gray-200 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              :value="text"
              :placeholder="props.placeholder"
              @input="handleEditorInput"
              @click="updateCursorIndex"
              @keyup="updateCursorIndex"
              @dragover.prevent
              @drop="handleDrop"
            />
            <div class="flex-col divide-gray-400 dark:divide-gray-300">
              <a
                target="_blank"
                :href="markdownDocsLink"
                class="text-sm text-gray-400 hover:underline dark:text-gray-300"
              >
                Markdown is supported
              </a>
              <AddImage
                v-if="props.allowImageUpload"
                label="Paste, drop, or click to add files"
                :field-name="fieldName"
                @file-change="
                  (input: FileChangeInput) => {
                    handleFileChange(input);
                  }
                "
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

    <!-- Regular editor form -->
    <form v-else class="relative rounded-md border p-2 dark:border-gray-600">
      <ErrorBanner
        v-if="createSignedStorageUrlError"
        :text="createSignedStorageUrlError.message"
      />
      <div
        v-if="showEmojiPicker"
        class="absolute z-50"
        :style="{
          top: emojiPickerPosition.top,
          left: emojiPickerPosition.left,
        }"
      >
        <div class="relative">
          <EmojiPicker @emoji-click="insertEmoji" @close="closeEmojiPicker" />
        </div>
      </div>
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
              @click="
                () => {
                  showFormatted = false;
                  selectedTab = 0;

                  // auto focus
                  nextTick(() => {
                    if (editorRef) {
                      editorRef.focus();
                    }
                  });
                }
              "
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
              @click="
                () => {
                  showFormatted = true;
                  selectedTab === 1;
                }
              "
            >
              Preview
            </Tab>
          </TabList>
          <div
            v-if="!showFormatted"
            class="flex flex-wrap items-center space-x-1"
          >
            <button
              v-for="button in formatButtons"
              :key="button.label"
              type="button"
              :aria-label="button.label"
              :class="[
                'border-transparent text-md rounded-md px-2 py-1 font-medium hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                button.class,
              ]"
              @click.prevent="
                button.format === 'emoji'
                  ? toggleEmojiPicker($event)
                  : button.format === 'fullscreen'
                    ? toggleFullScreen()
                    : formatTextArea(button.format)
              "
            >
              <EyeSlashIcon
                v-if="button.format === 'spoiler'"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <span v-else>{{ button.label }}</span>
            </button>
          </div>
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
            <div
              v-if="showBotSuggestions"
              class="absolute left-0 right-0 z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                v-for="suggestion in filteredBotSuggestions"
                :key="suggestion.value"
                type="button"
                class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                @click.prevent="applyBotSuggestion(suggestion)"
              >
                <span>{{ suggestion.label }}</span>
              </button>
            </div>
            <div class="mt-2 flex-col divide-gray-400 dark:divide-gray-300">
              <a
                target="_blank"
                :href="markdownDocsLink"
                class="text-sm text-gray-400 hover:underline dark:text-gray-300"
              >
                Markdown is supported
              </a>
              <AddImage
                v-if="props.allowImageUpload"
                label="Paste, drop, or click to add files"
                :field-name="fieldName"
                @file-change="
                  (input: FileChangeInput) => {
                    handleFileChange(input);
                  }
                "
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
