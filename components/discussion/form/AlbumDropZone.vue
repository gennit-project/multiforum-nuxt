<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    isLimitReached: boolean;
    maxImages: number;
    fileUploadAvailable?: boolean;
    fileUploadUnavailableMessage?: string;
    setupUrl?: string;
  }>(),
  {
    fileUploadAvailable: true,
    fileUploadUnavailableMessage: '',
    setupUrl: '',
  }
);

const emit = defineEmits<{
  (e: 'files-selected', files: FileList): void;
  (e: 'drop', event: DragEvent): void;
  (e: 'show-url-input' | 'show-existing-picker'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const selectFiles = (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!props.fileUploadAvailable) return;

  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }

  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileInputChange = (event: Event) => {
  if (!props.fileUploadAvailable) return;

  const input = event.target as HTMLInputElement;
  if (!input?.files?.length) return;

  emit('files-selected', input.files);

  // Reset the input so user can re-upload the same file if needed
  input.value = '';
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!props.fileUploadAvailable) return;
  emit('drop', event);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleShowUrlInput = () => {
  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }
  emit('show-url-input');
};

const handleShowExistingPicker = (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }
  emit('show-existing-picker');
};
</script>

<template>
  <div
    v-if="!isLimitReached"
    class="my-3 rounded-md border-2 border-dotted border-gray-400 p-4 text-center"
    :class="fileUploadAvailable ? 'cursor-pointer' : ''"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <label
      for="album-file-input"
      class="flex h-full w-full flex-col items-center justify-center"
      :class="fileUploadAvailable ? 'cursor-pointer' : ''"
    >
      <p class="mb-3 text-sm text-gray-500 dark:text-gray-300">
        {{
          fileUploadAvailable
            ? 'Drag and drop, tap to add files, paste a link, or reuse an image you already have'
            : 'Paste a link or reuse an image you already have'
        }}
      </p>
      <p
        v-if="fileUploadUnavailableMessage"
        class="mb-3 text-xs text-amber-800 dark:text-amber-200"
      >
        {{ fileUploadUnavailableMessage }}
        <NuxtLink
          v-if="setupUrl"
          :to="setupUrl"
          class="font-medium underline"
        >
          Open instance setup
        </NuxtLink>
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4 text-black">
        <button
          type="button"
          class="rounded bg-orange-500 px-4 py-2 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
          :disabled="!fileUploadAvailable"
          @click="selectFiles"
        >
          Choose Files
        </button>
        <div class="hidden h-6 w-px bg-gray-300 sm:block dark:bg-gray-600" />
        <button
          type="button"
          class="rounded bg-blue-500 px-4 py-2 transition-colors hover:bg-blue-600"
          @click="handleShowUrlInput"
        >
          Link to Image
        </button>
        <div class="hidden h-6 w-px bg-gray-300 sm:block dark:bg-gray-600" />
        <button
          type="button"
          class="rounded border border-gray-300 bg-white px-4 py-2 text-gray-800 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          @click="handleShowExistingPicker"
        >
          Reuse an Image
        </button>
      </div>
    </label>
    <input
      id="album-file-input"
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      :disabled="!fileUploadAvailable"
      @change="handleFileInputChange"
    >
  </div>
  <div
    v-else
    class="bg-gray-50 my-3 rounded-md border-2 border-dotted border-gray-300 p-4 text-center opacity-70 dark:bg-gray-800"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Maximum limit of {{ maxImages }} images reached
    </p>
  </div>
</template>
