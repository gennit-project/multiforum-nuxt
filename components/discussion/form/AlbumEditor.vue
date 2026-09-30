<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useUsername } from '@/composables/useAuthState';
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import AlbumImageItem from './AlbumImageItem.vue';
import AlbumDropZone from './AlbumDropZone.vue';
import AlbumUrlInputForm from './AlbumUrlInputForm.vue';
import AlbumExistingImagePicker from './AlbumExistingImagePicker.vue';
import type { LibraryTabKey } from './reusableImageTypes';
import { useAlbumImageUpload } from '@/composables/useAlbumImageUpload';
import { useAlbumAutoSave } from '@/composables/useAlbumAutoSave';
import { useImageMetadataAutoSave } from '@/composables/useImageMetadataAutoSave';
import WarningModal from '@/components/WarningModal.vue';
import {
  orderImagesByOrder,
  getImageIdOrder,
  moveImageOrderUp,
  moveImageOrderDown,
} from '@/utils/albumImageOrder';
import type { Album } from '@/__generated__/graphql';
import { useInstanceCapability } from '@/composables/useInstanceSetupStatus';

const usernameVar = useUsername();

const MAX_IMAGES = 25;

type ImageInput = {
  id?: string;
  url: string;
  alt: string;
  copyright: string;
  caption: string;
  Uploader?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
};

type ExistingImageInput = Omit<
  Partial<ImageInput>,
  'alt' | 'caption' | 'copyright' | 'url'
> & {
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
};

const props = withDefaults(
  defineProps<{
    formValues: {
      album: {
        images: ImageInput[];
        imageOrder: string[];
      };
    };
    allowImageUpload?: boolean;
    discussionId?: string;
    existingAlbum?: Album | null | undefined;
    autoSave?: boolean;
  }>(),
  {
    allowImageUpload: true,
    discussionId: undefined,
    existingAlbum: undefined,
    autoSave: true,
  }
);

const emit = defineEmits(['updateFormValues']);
const {
  capability: uploadsCapability,
  available: uploadsAvailable,
  loading: uploadsLoading,
  error: uploadsError,
} = useInstanceCapability('uploads');
const uploadsUnavailable = computed(
  () => Boolean(uploadsCapability.value) && !uploadsAvailable.value
);
const uploadsCheckFailed = computed(
  () => Boolean(uploadsError.value) && !uploadsCapability.value
);
const fileUploadAvailable = computed(
  () => props.allowImageUpload !== false && uploadsAvailable.value
);
const fileUploadUnavailableMessage = computed(() => {
  if (props.allowImageUpload === false) {
    return 'File uploads are disabled for this channel.';
  }
  if (uploadsCheckFailed.value) {
    return 'File upload availability could not be checked. Try refreshing the page.';
  }
  if (uploadsUnavailable.value) {
    return 'File uploads are unavailable until file storage is configured.';
  }
  if (uploadsLoading.value && !uploadsCapability.value) {
    return 'Checking file upload availability...';
  }
  return '';
});
const uploadSetupUrl = computed(() =>
  uploadsUnavailable.value
    ? uploadsCapability.value?.setupUrl || '/admin/setup#file-uploads'
    : ''
);

// Track if we've reached the image limit
const isImageLimitReached = computed(() => {
  return (props.formValues.album?.images?.length ?? 0) >= MAX_IMAGES;
});

// Ordered images based on imageOrder field
const orderedImages = computed(() =>
  orderImagesByOrder({
    images: props.formValues.album?.images,
    imageOrder: props.formValues.album?.imageOrder,
  })
);

const selectedImageIds = computed(() =>
  props.formValues.album.images
    .map((image) => image.id)
    .filter((id): id is string => Boolean(id))
);

// Helper to update imageOrder after changes
const updateImageOrderAfterChange = (images: ImageInput[]) =>
  getImageIdOrder(images);

// Helper to add new images to the album in a single form update, so several
// images can be added at once without each update overwriting the last.
const addNewImages = (inputs: Partial<ImageInput>[]) => {
  const currentImages = props.formValues.album?.images ?? [];
  const remainingSlots = MAX_IMAGES - currentImages.length;

  if (remainingSlots <= 0) {
    alert(`You've reached the maximum limit of ${MAX_IMAGES} images.`);
    return;
  }

  const knownIds = new Set(selectedImageIds.value);
  const newImages: ImageInput[] = [];

  for (const input of inputs) {
    if (newImages.length >= remainingSlots) break;

    const { url, alt, caption, copyright, id, Uploader } = input;
    if (id && knownIds.has(id)) continue;
    if (id) knownIds.add(id);

    newImages.push({
      id,
      url: url || '',
      alt: alt || '',
      caption: caption || '',
      copyright: copyright || '',
      Uploader,
    });
  }

  if (newImages.length === 0) return;

  emit('updateFormValues', {
    album: {
      images: [...currentImages, ...newImages],
      imageOrder: [
        ...props.formValues.album.imageOrder,
        ...newImages
          .map((image) => image.id)
          .filter((id): id is string => Boolean(id)),
      ],
    },
  });

  requestAutoSave();
};

const addNewImage = (input: Partial<ImageInput>) => addNewImages([input]);

const addExistingImage = (image: ExistingImageInput) => {
  addNewImage({
    id: image.id,
    url: image.url || '',
    alt: image.alt || '',
    caption: image.caption || '',
    copyright: image.copyright || '',
    Uploader: image.Uploader,
  });
};

const addExistingImages = (images: ExistingImageInput[]) => {
  addNewImages(
    images.map((image) => ({
      id: image.id,
      url: image.url || '',
      alt: image.alt || '',
      caption: image.caption || '',
      copyright: image.copyright || '',
      Uploader: image.Uploader,
    }))
  );
  showExistingImagePicker.value = false;
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

const requestAutoSave = () => {
  if (props.autoSave) {
    debouncedAutoSave();
  }
};

// Alt text, caption and attribution are saved on the Image itself; the album
// save only handles which images are in the album, their order and URLs.
const { saveImageMetadata, imageMetadataError } = useImageMetadataAutoSave();
const IMAGE_METADATA_FIELDS = new Set<keyof ImageInput>([
  'alt',
  'caption',
  'copyright',
]);

// URL input form state
const showUrlInput = ref(false);
// Existing-image picker is hidden until the user asks to reuse an image, so we
// don't fire its query on every form load.
const showExistingImagePicker = ref(false);
const libraryInitialTab = ref<LibraryTabKey>('uploads');
const isCreatingImageFromUrl = ref(false);
const urlInputFormRef = ref<InstanceType<typeof AlbumUrlInputForm> | null>(
  null
);
const pendingRemoveImageIndex = ref<number | null>(null);

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

  const updatedImage = updatedImages[actualIndex];
  if (IMAGE_METADATA_FIELDS.has(fieldName) && updatedImage?.id) {
    saveImageMetadata({
      imageId: updatedImage.id,
      metadata: {
        alt: updatedImage.alt,
        caption: updatedImage.caption,
        copyright: updatedImage.copyright,
      },
    });
    return;
  }

  requestAutoSave();
};

const removeImageFromAlbum = (index: number) => {
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

  requestAutoSave();
};

const requestRemoveImage = (index: number) => {
  pendingRemoveImageIndex.value = index;
};

const closeRemoveImageModal = () => {
  pendingRemoveImageIndex.value = null;
};

const confirmRemoveImage = () => {
  if (pendingRemoveImageIndex.value === null) return;

  removeImageFromAlbum(pendingRemoveImageIndex.value);
  pendingRemoveImageIndex.value = null;
};

// Move image up handler
const moveImageUp = (index: number) => {
  if (index <= 0) return;

  emit('updateFormValues', {
    album: {
      images: props.formValues.album.images,
      imageOrder: moveImageOrderUp(props.formValues.album.imageOrder, index),
    },
  });

  requestAutoSave();
};

// Move image down handler
const moveImageDown = (index: number) => {
  const imageOrder = props.formValues.album.imageOrder;
  if (index >= imageOrder.length - 1) return;

  emit('updateFormValues', {
    album: {
      images: props.formValues.album.images,
      imageOrder: moveImageOrderDown(imageOrder, index),
    },
  });

  requestAutoSave();
};

// Handle files selected from drop zone
const handleFilesSelected = (files: FileList) => {
  if (!fileUploadAvailable.value) return;
  handleMultipleFiles(files);
};

// Handle drop event from drop zone
const handleDropEvent = (event: DragEvent) => {
  if (!fileUploadAvailable.value) return;
  handleDrop(event, true, isImageLimitReached.value);
};

// Show URL input form
const handleShowUrlInput = () => {
  showUrlInput.value = true;
  urlInputFormRef.value?.focusInput();
};

// Reveal the reusable-image picker (and the query it runs) on demand
const handleShowExistingPicker = (tab?: LibraryTabKey) => {
  libraryInitialTab.value = tab ?? 'uploads';
  showExistingImagePicker.value = true;
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
    urlInputFormRef.value?.setError(
      'Failed to create image. Please try again.'
    );
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
    <ErrorBanner v-if="imageMetadataError" :text="imageMetadataError.message" />

    <!-- Auto-save indicators -->
    <div
      v-if="isAutoSaving || autoSaveSuccess"
      class="mb-2 flex items-center gap-2"
    >
      <LoadingSpinner v-if="isAutoSaving" class="h-4 w-4" />
      <span
        v-if="isAutoSaving"
        class="text-sm text-blue-600 dark:text-blue-400"
      >
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
      @delete="requestRemoveImage(index)"
      @move-up="moveImageUp(index)"
      @move-down="moveImageDown(index)"
    />

    <AlbumExistingImagePicker
      :open="showExistingImagePicker"
      :selected-image-ids="selectedImageIds"
      :max-images="MAX_IMAGES"
      :initial-tab="libraryInitialTab"
      @add-images="addExistingImages"
      @close="showExistingImagePicker = false"
    />

    <!-- Drop zone -->
    <AlbumDropZone
      :is-limit-reached="isImageLimitReached"
      :max-images="MAX_IMAGES"
      :compact="orderedImages.length > 0"
      :selected-image-ids="selectedImageIds"
      :file-upload-available="fileUploadAvailable"
      :file-upload-unavailable-message="fileUploadUnavailableMessage"
      :setup-url="uploadSetupUrl"
      @files-selected="handleFilesSelected"
      @drop="handleDropEvent"
      @show-url-input="handleShowUrlInput"
      @show-existing-picker="handleShowExistingPicker"
      @add-existing-image="addExistingImage"
    />

    <!-- URL input form -->
    <AlbumUrlInputForm
      v-if="showUrlInput"
      ref="urlInputFormRef"
      :is-creating="isCreatingImageFromUrl"
      @submit="handleUrlSubmit"
      @cancel="handleUrlCancel"
    />

    <WarningModal
      :open="pendingRemoveImageIndex !== null"
      title="Remove this image from the album?"
      body="The original image will remain in the library, collections, and other albums."
      primary-button-text="Remove from album"
      secondary-button-text="Cancel"
      icon="trash"
      data-testid="remove-album-image-modal"
      @primary-button-click="confirmRemoveImage"
      @close="closeRemoveImageModal"
    />
  </div>
</template>
