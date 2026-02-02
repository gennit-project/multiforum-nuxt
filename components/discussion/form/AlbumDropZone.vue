<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
  isLimitReached: boolean;
  maxImages: number;
}>();

const emit = defineEmits<{
  (e: 'files-selected', files: FileList): void;
  (e: 'drop', event: DragEvent): void;
  (e: 'show-url-input'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const selectFiles = (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }

  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input?.files?.length) return;

  emit('files-selected', input.files);

  // Reset the input so user can re-upload the same file if needed
  input.value = '';
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
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
</script>

<template>
  <div
    v-if="!isLimitReached"
    class="my-3 cursor-pointer rounded-md border-2 border-dotted border-gray-400 p-4 text-center"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <label
      for="album-file-input"
      class="flex h-full w-full cursor-pointer flex-col items-center justify-center"
    >
      <p class="mb-3 text-sm text-gray-500 dark:text-gray-300">
        Drag and drop, tap to add files, or paste a link to an image
      </p>
      <div class="flex items-center gap-4 text-black">
        <button
          type="button"
          class="rounded bg-orange-500 px-4 py-2 transition-colors hover:bg-orange-600"
          @click="selectFiles"
        >
          Choose Files
        </button>
        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        <button
          type="button"
          class="rounded bg-blue-500 px-4 py-2 transition-colors hover:bg-blue-600"
          @click="handleShowUrlInput"
        >
          Link to Image
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
