<script lang="ts" setup>
import { ref, computed } from 'vue';
import { usernameVar } from '@/cache';
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import AlbumImageItem from './AlbumImageItem.vue';
import AlbumDropZone from './AlbumDropZone.vue';
import AlbumUrlInputForm from './AlbumUrlInputForm.vue';
import { useAlbumImageUpload } from '@/composables/useAlbumImageUpload';
import { useAlbumAutoSave } from '@/composables/useAlbumAutoSave';
import type { Album } from '@/__generated__/graphql';

const MAX_IMAGES = 25;

type ImageInput = {
  id?: string;
  url: string;
  alt: string;
  copyright: string;
  caption: string;
};

const props = defineProps<{
  formValues: {
    album: {
      images: ImageInput[];
      imageOrder: string[];
    };
  };
  allowImageUpload?: boolean;
  discussionId?: string;
  existingAlbum?: Album | null | undefined;
}>();

const emit = defineEmits(['updateFormValues']);

// Track if we've reached the image limit
const isImageLimitReached = computed(() => {
  return (props.formValues.album?.images?.length ?? 0) >= MAX_IMAGES;
});

// Ordered images based on imageOrder field
const orderedImages = computed(() => {
  if (!props.formValues.album?.images) {
    return [];
  }

  if (
    !props.formValues.album.imageOrder ||
    props.formValues.album.imageOrder.length === 0
  ) {
    return props.formValues.album.images;
  }

  return props.formValues.album.imageOrder
    .map((imageId) => {
      return props.formValues.album.images?.find(
        (image) => image.id === imageId
      );
    })
    .filter((image) => image !== undefined);
});

// Helper to update imageOrder after changes
const updateImageOrderAfterChange = (images: ImageInput[]) => {
  return images.map((img) => img.id).filter((id) => id !== undefined);
};

// Helper to add a new image to the album
const addNewImage = (input: Partial<ImageInput>) => {
  if ((props.formValues.album?.images?.length ?? 0) >= MAX_IMAGES) {
    alert(`You've reached the maximum limit of ${MAX_IMAGES} images.`);
    return;
  }

  const { url, alt, caption, copyright, id } = input;

  const newImage: ImageInput = {
    id,
    url: url || '',
    alt: alt || '',
    caption: caption || '',
    copyright: copyright || '',
  };

  const updatedImages = [...props.formValues.album.images, newImage];
  const updatedImageOrder = [...props.formValues.album.imageOrder];

  if (id) {
    updatedImageOrder.push(id);
  }

  emit('updateFormValues', {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });

  debouncedAutoSave();
};

// Initialize image upload composable
const {
  loadingStates,
  uploadStatus,
  createSignedStorageUrlError,
  createImageError,
  handleMultipleFiles,
  handleDrop,
  createImageFromUrl,
} = useAlbumImageUpload({
  maxImages: MAX_IMAGES,
  currentImageCount: () => props.formValues.album?.images?.length ?? 0,
  onImageUploaded: (image) => {
    addNewImage(image);
  },
});

// Initialize auto-save composable
const {
  isAutoSaving,
  autoSaveSuccess,
  updateDiscussionError,
  debouncedAutoSave,
} = useAlbumAutoSave({
  discussionId: props.discussionId,
  existingAlbum: props.existingAlbum,
  getAlbumData: () => props.formValues.album,
});

// URL input form state
const showUrlInput = ref(false);
const isCreatingImageFromUrl = ref(false);
const urlInputFormRef = ref<InstanceType<typeof AlbumUrlInputForm> | null>(null);

// Image field update handler
const updateImageField = (
  index: number,
  fieldName: keyof ImageInput,
  newValue: string
) => {
  const orderedImage = orderedImages.value[index];
  if (!orderedImage || !orderedImage.id) return;

  const actualIndex = props.formValues.album.images.findIndex(
    (img) => img.id === orderedImage.id
  );
  if (actualIndex === -1) return;

  const updatedImages = [...props.formValues.album.images];
  const existingImage = updatedImages[actualIndex];
  if (!existingImage) return;

  updatedImages[actualIndex] = {
    ...existingImage,
    [fieldName]: newValue,
  };

  emit('updateFormValues', {
    album: {
      images: updatedImages,
      imageOrder: props.formValues.album.imageOrder,
    },
  });

  debouncedAutoSave();
};

// Delete image handler
const deleteImage = (index: number) => {
  const orderedImage = orderedImages.value[index];
  if (!orderedImage || !orderedImage.id) return;

  const actualIndex = props.formValues.album.images.findIndex(
    (img) => img.id === orderedImage.id
  );
  if (actualIndex === -1) return;

  const updatedImages = [...props.formValues.album.images];
  updatedImages.splice(actualIndex, 1);

  const updatedImageOrder = updateImageOrderAfterChange(updatedImages);

  emit('updateFormValues', {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });

  debouncedAutoSave();
};

// Move image up handler
const moveImageUp = (index: number) => {
  if (index <= 0) return;

  const updatedImageOrder = [...props.formValues.album.imageOrder];
  const currentItem = updatedImageOrder[index];
  const previousItem = updatedImageOrder[index - 1];

  if (currentItem && previousItem) {
    [updatedImageOrder[index], updatedImageOrder[index - 1]] = [
      previousItem,
      currentItem,
    ];
  }

  emit('updateFormValues', {
    album: {
      images: props.formValues.album.images,
      imageOrder: updatedImageOrder,
    },
  });

  debouncedAutoSave();
};

// Move image down handler
const moveImageDown = (index: number) => {
  const imageOrder = props.formValues.album.imageOrder;
  if (index >= imageOrder.length - 1) return;

  const updatedImageOrder = [...imageOrder];
  const currentItem = updatedImageOrder[index];
  const nextItem = updatedImageOrder[index + 1];

  if (currentItem && nextItem) {
    [updatedImageOrder[index], updatedImageOrder[index + 1]] = [
      nextItem,
      currentItem,
    ];
  }

  emit('updateFormValues', {
    album: {
      images: props.formValues.album.images,
      imageOrder: updatedImageOrder,
    },
  });

  debouncedAutoSave();
};

// Handle files selected from drop zone
const handleFilesSelected = (files: FileList) => {
  if (props.allowImageUpload === false) return;
  handleMultipleFiles(files);
};

// Handle drop event from drop zone
const handleDropEvent = (event: DragEvent) => {
  if (props.allowImageUpload === false) return;
  handleDrop(event, true, isImageLimitReached.value);
};

// Show URL input form
const handleShowUrlInput = () => {
  showUrlInput.value = true;
  urlInputFormRef.value?.focusInput();
};

// Handle URL submission
const handleUrlSubmit = async (url: string) => {
  if (!usernameVar.value) {
    urlInputFormRef.value?.setError('No username found, cannot create image.');
    return;
  }

  isCreatingImageFromUrl.value = true;

  const createdImage = await createImageFromUrl(url);

  if (createdImage) {
    addNewImage(createdImage);
    showUrlInput.value = false;
    urlInputFormRef.value?.reset();
  } else {
    urlInputFormRef.value?.setError('Failed to create image. Please try again.');
  }

  isCreatingImageFromUrl.value = false;
};

// Handle URL input cancel
const handleUrlCancel = () => {
  showUrlInput.value = false;
};
</script>

<template>
  <div class="rounded-md border p-2 dark:border-gray-600">
    <!-- Error banners -->
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
    <ErrorBanner v-if="createImageError" :text="createImageError.message" />
    <ErrorBanner
      v-if="updateDiscussionError"
      :text="updateDiscussionError.message"
    />

    <!-- Auto-save indicators -->
    <div
      v-if="isAutoSaving || autoSaveSuccess"
      class="mb-2 flex items-center gap-2"
    >
      <LoadingSpinner v-if="isAutoSaving" class="h-4 w-4" />
      <span v-if="isAutoSaving" class="text-sm text-blue-600 dark:text-blue-400">
        Saving album...
      </span>
      <span
        v-else-if="autoSaveSuccess"
        class="text-sm text-green-600 dark:text-green-400"
      >
        ✓ Album saved
      </span>
    </div>

    <!-- Upload progress -->
    <div v-if="loadingStates[-1]" class="mb-2 flex items-center gap-2">
      <LoadingSpinner />
      <span
        v-if="uploadStatus"
        class="text-sm text-gray-600 dark:text-gray-300"
      >
        {{ uploadStatus }}
      </span>
    </div>

    <!-- Image count -->
    <div class="mb-2">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ props.formValues.album?.images?.length ?? 0 }}/{{ MAX_IMAGES }}
        images
      </p>
    </div>

    <!-- Image list -->
    <AlbumImageItem
      v-for="(image, index) in orderedImages"
      :key="image?.id || `temp-${index}`"
      :image="image"
      :index="index"
      :is-first="index === 0"
      :is-last="index === orderedImages.length - 1"
      :is-loading="loadingStates[index] ?? false"
      @update-field="(field, value) => updateImageField(index, field, value)"
      @delete="deleteImage(index)"
      @move-up="moveImageUp(index)"
      @move-down="moveImageDown(index)"
    />

    <!-- Drop zone -->
    <AlbumDropZone
      :is-limit-reached="isImageLimitReached"
      :max-images="MAX_IMAGES"
      @files-selected="handleFilesSelected"
      @drop="handleDropEvent"
      @show-url-input="handleShowUrlInput"
    />

    <!-- URL input form -->
    <AlbumUrlInputForm
      v-if="showUrlInput"
      ref="urlInputFormRef"
      :is-creating="isCreatingImageFromUrl"
      @submit="handleUrlSubmit"
      @cancel="handleUrlCancel"
    />
  </div>
</template>
