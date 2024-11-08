<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/vue";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import AddImage from "@/components/AddImage.vue";
import { uploadAndGetEmbeddedLink, getUploadFileName } from "@/utils";
import ErrorBanner from "./ErrorBanner.vue";
import { usernameVar } from "@/cache";
import { MAX_CHARS_IN_COMMENT } from "@/utils/constants";

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
    default: "",
  },
  testId: {
    type: String,
    default: "texteditor-textarea",
  },
  placeholder: {
    type: String,
    default: "Write your comment here...",
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
});
const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
  useMutation(CREATE_SIGNED_STORAGE_URL);

// Refs
const editorRef = ref<HTMLTextAreaElement | null>(null);
const text = ref(props.initialValue);
const showFormatted = ref(false);

// Methods
const focusEditor = () => {
  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus();
    }
  });
};

const emit = defineEmits(["update"]);

const updateText = (newText: string) => {
  text.value = newText;
  emit("update", newText);
};

const formatText = (format: string) => {
  const textarea = editorRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  let formattedText = "";
  switch (format) {
    case "bold":
      formattedText = `**${selectedText}**`;
      break;
    case "italic":
      formattedText = `*${selectedText}*`;
      break;
    case "underline":
      formattedText = `<u>${selectedText}</u>`;
      break;
    case "header1":
      formattedText = `# ${selectedText}`;
      break;
    case "header2":
      formattedText = `## ${selectedText}`;
      break;
    case "header3":
      formattedText = `### ${selectedText}`;
      break;
    default:
      formattedText = selectedText;
  }

  textarea.setRangeText(formattedText, start, end, "end");
  updateText(textarea.value);
};

const handlePaste = async (event: ClipboardEvent) => {
  if (!props.allowImageUpload) return;

  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
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

  const cursorPositionStart = textarea.selectionStart;
  const cursorPositionEnd = textarea.selectionEnd;

  const placeholderText = `Uploading image...`;
  const markdownLink = `![${file.name}](${placeholderText})`;

  textarea.setRangeText(
    markdownLink,
    cursorPositionStart,
    cursorPositionEnd,
    "end"
  );
  text.value = textarea.value;

  const placeholderStart = cursorPositionStart;
  const placeholderEnd = placeholderStart + markdownLink.length;

  const embeddedLink = await upload(file);
  if (!embeddedLink) return;

  const newMarkdownLink = `![${file.name}](${embeddedLink})`;
  const newText =
    textarea.value.slice(0, placeholderStart) +
    newMarkdownLink +
    textarea.value.slice(placeholderEnd);

  text.value = newText;
  textarea.setSelectionRange(
    placeholderStart + newMarkdownLink.length,
    placeholderStart + newMarkdownLink.length
  );
  emit("update", text.value);
};

const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error("No username found");
    return;
  }

  try {
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const signedStorageURLInput = { filename, contentType: file.type };

    const signedUrlResult = await createSignedStorageUrl(signedStorageURLInput);
    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    const embeddedLink = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: file.type,
      signedStorageURL,
    });
    return embeddedLink;
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

// Lifecycle hooks
onMounted(() => {
  if (!props.disableAutoFocus) {
    focusEditor();
  }
});

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.addEventListener("paste", handlePaste);
  }
});

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.removeEventListener("paste", handlePaste);
  }
});

// Format buttons configuration
const formatButtons = [
  { label: "B", format: "bold" },
  { label: "I", format: "italic" },
  { label: "U", format: "underline" },
  { label: "H1", format: "header1" },
  { label: "H2", format: "header2" },
  { label: "H3", format: "header3" },
];

const markdownDocsLink = "https://www.markdownguide.org/basic-syntax/";

const handleFileChange = async (event: any) => {
  if (!props.allowImageUpload) {
    return;
  }
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    await handleFormStateDuringUpload(selectedFile);
  }
};

const handleDrop = async (event: any) => {
  event.preventDefault();
  if (!props.allowImageUpload) {
    return;
  }

  const { files } = event.dataTransfer;

  if (files.length === 0) {
    return;
  }

  // Assuming you want to handle only the first dropped file.
  const file = files[0];
  handleFormStateDuringUpload(file);
};

const selectedTab = ref(0);
</script>

<template>
  <form class="rounded-md border p-2 dark:border-gray-600">
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
    <TabGroup as="div">
      <TabList
        class="border-b pb-2 dark:border-gray-600 sm:flex-wrap md:flex md:justify-between"
      >
        <div class="flex items-center">
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
        </div>
        <div v-if="!showFormatted" class="flex items-center space-x-1">
          <button
            v-for="button in formatButtons"
            :key="button.label"
            class="border-transparent rounded-md px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:text-gray-300"
            @click.prevent="formatText(button.format)"
          >
            {{ button.label }}
          </button>
        </div>
      </TabList>
      <TabPanels class="mt-2">
        <TabPanel class="-m-0.5 rounded-md px-0.5 py-1">
          <textarea
            ref="editorRef"
            :data-testid="props.testId"
            :rows="props.rows"
            :placeholder="props.placeholder"
            class="block w-full rounded-md border border-gray-200 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            :value="text"
            @input="updateText(($event.target as HTMLInputElement).value)"
            @dragover.prevent
            @drop="handleDrop"
          />
          <div
            class="mt-2 flex space-x-2 divide-x divide-gray-400 dark:divide-gray-300"
          >
            <a
              target="_blank"
              :href="markdownDocsLink"
              class="text-gray-400 hover:underline dark:text-gray-300"
            >
              Markdown is supported
            </a>
            <AddImage
              v-if="props.allowImageUpload"
              class="pl-2"
              label="Paste, drop, or click to add files"
              @change="handleFileChange"
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
