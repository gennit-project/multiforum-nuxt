<script lang="ts" setup>
import { ref, computed, nextTick } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL, CREATE_IMAGE, UPDATE_DISCUSSION } from "@/graphQLData/discussion/mutations";
import { usernameVar } from "@/cache";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";
import TextInput from "@/components/TextInput.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import FormRow from "@/components/FormRow.vue";
import { useDisplay } from "vuetify";
import ExpandableImage from "@/components/ExpandableImage.vue";
import { isFileSizeValid } from "@/utils/index";

const props = defineProps<{
  formValues: {
    album: {
      images: {
        id?: string;
        url: string;
        alt: string;
        caption: string;
        copyright: string;
      }[];
      imageOrder: string[];
    };
  };
  allowImageUpload?: boolean;
  discussionId?: string; // For auto-save functionality
  existingAlbum?: {
    id: string;
    Images: {
      id: string;
      url: string;
      alt: string;
      caption: string;
      copyright: string;
    }[];
    imageOrder: string[];
  } | null;
}>();

const emit = defineEmits(["updateFormValues"]);

const { mdAndDown } = useDisplay();

// Maximum number of images allowed
const MAX_IMAGES = 25;

type ImageInput = {
  id?: string;
  url: string;
  alt: string;
  copyright: string;
  caption: string;
};

// GraphQL Mutations

// Mutation to get the signed storage URL
const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
  useMutation(CREATE_SIGNED_STORAGE_URL);

// Mutation to create an image record in the database
const { mutate: createImage, error: createImageError } =
  useMutation(CREATE_IMAGE);

// Mutation to update discussion with album data (for auto-save)
const { mutate: updateDiscussion, error: updateDiscussionError, loading: updateDiscussionLoading } =
  useMutation(UPDATE_DISCUSSION);

// Keep track of which item is uploading or done
const loadingStates = ref<{ [key: number]: boolean }>({});

// Track if we've reached the image limit
const isImageLimitReached = computed(() => {
  return (props.formValues.album?.images?.length ?? 0) >= MAX_IMAGES;
});

/**
 * Upload a single file and return the created image object or null on failure.
 * This handles both uploading the file to storage and creating the Image record in the database.
 */
const uploadFile = async (file: File): Promise<boolean> => {
  if (!usernameVar.value) {
    console.error("No username found, cannot upload.");
    return false;
  }
  const sizeCheck = isFileSizeValid({ file });
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return false;
  }

  try {
    // Generate a unique filename
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const contentType = file.type;
    const signedStorageURLInput = { filename, contentType };

    // Ask the server for a signed storage URL
    const signedUrlResult = await createSignedStorageUrl(signedStorageURLInput);
    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    if (!signedStorageURL) {
      throw new Error("No signed storage URL returned");
    }

    // Upload the file using the signed URL
    const fileUrl = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: contentType,
      signedStorageURL,
    });
    
    if (!fileUrl) {
      throw new Error("No file URL returned from upload");
    }
    
    // Now create the Image record in the database
    const createImageResult = await createImage({
      url: fileUrl,
      alt: file.name,           // Default to filename for alt text
      caption: "",              // Empty caption by default
      copyright: "",            // Empty copyright by default
      username: usernameVar.value
    });
    
    // Get the created image from the result
    const createdImage = createImageResult?.data?.createImages?.images?.[0];
    
    if (!createdImage || !createdImage.id) {
      throw new Error("Failed to create image record in database");
    }
    
    // Add the image to our album using the addNewImage helper
    addNewImage({
      id: createdImage.id,
      url: createdImage.url,
      alt: createdImage.alt || file.name,
      caption: createdImage.caption || "",
      copyright: createdImage.copyright || ""
    });
    
    return true;
  } catch (err) {
    console.error("Error uploading file and creating image:", err);
    return false;
  }
};

// Status message for upload feedback
const uploadStatus = ref('');

// State for URL input form
const showUrlInput = ref(false);
const imageUrl = ref('');
const urlInputError = ref('');
const isCreatingImageFromUrl = ref(false);
const urlInputRef = ref<{ focus: () => void } | null>(null);

// Auto-save state
const isAutoSaving = ref(false);
const autoSaveSuccess = ref(false);
let autoSaveTimeout: NodeJS.Timeout | null = null;

// Computed property to check if URL is valid for enabling Add Image button
const isUrlValid = computed(() => {
  if (!imageUrl.value.trim()) return false;
  try {
    new URL(imageUrl.value.trim());
    return true;
  } catch {
    return false;
  }
});

/**
 * Handle uploading multiple files at once
 * Each file is uploaded and added to the album immediately after successful creation
 */
const handleMultipleFiles = async (files: FileList | File[]) => {
  if (!files || files.length === 0) return;

  // Check if adding these files would exceed the limit
  if ((props.formValues.album?.images?.length ?? 0) + files.length > MAX_IMAGES) {
    const remainingSlots = MAX_IMAGES - props.formValues.album.images.length;
    alert(
      `You can only add ${remainingSlots} more image${remainingSlots !== 1 ? "s" : ""}. Maximum limit is ${MAX_IMAGES} images.`
    );
    // Only process up to the remaining slots
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    if (filesToProcess.length === 0) return;

    loadingStates.value[-1] = true;
    uploadStatus.value = `Uploading 0/${filesToProcess.length} images...`;

    // Process files one by one
    let successCount = 0;
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      uploadStatus.value = `Uploading ${i+1}/${filesToProcess.length} images...`;
      const success = await uploadFile(file);
      if (success) successCount++;
    }
    
    uploadStatus.value = `Successfully uploaded ${successCount} image${successCount !== 1 ? 's' : ''}.`;
    setTimeout(() => {
      uploadStatus.value = '';
    }, 3000);
  } else {
    // Normal flow when not exceeding limits
    loadingStates.value[-1] = true;

    // Convert FileList to Array first
    const filesArray = Array.from(files);
    uploadStatus.value = `Uploading 0/${filesArray.length} images...`;
    
    // Process files one by one sequentially to avoid race conditions
    let successCount = 0;
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      uploadStatus.value = `Uploading ${i+1}/${filesArray.length} images...`;
      const success = await uploadFile(file);
      if (success) successCount++;
    }
    
    uploadStatus.value = `Successfully uploaded ${successCount} image${successCount !== 1 ? 's' : ''}.`;
    setTimeout(() => {
      uploadStatus.value = '';
    }, 3000);
  }

  // Turn off the global loading
  loadingStates.value[-1] = false;
};

// ------------------------------------
//  Handling the drop zone
// ------------------------------------

const albumFileInputRef = ref<HTMLInputElement | null>(null);

const selectFiles = (event?: Event) => {
  // Prevent the default action if this is a button click
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Check if we've reached the limit before opening file dialog
  if (isImageLimitReached.value) {
    alert(`You've reached the maximum limit of ${MAX_IMAGES} images.`);
    return;
  }

  // Programmatically trigger file input click
  if (albumFileInputRef.value) {
    // This works reliably on both mobile and desktop browsers
    albumFileInputRef.value.click();
  }
};

const handleFileInputChange = (event: Event) => {
  if (props.allowImageUpload === false) return;
  const input = event.target as HTMLInputElement;
  if (!input?.files?.length) return;
  handleMultipleFiles(input.files);
  // Reset the input so user can re-upload the same file if needed
  input.value = "";
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();

  if (props.allowImageUpload === false) return;
  if (!event.dataTransfer?.files?.length) return;

  // Check if we've reached the limit before processing dropped files
  if (isImageLimitReached.value) {
    alert(`You've reached the maximum limit of ${MAX_IMAGES} images.`);
    return;
  }

  const files = event.dataTransfer.files;
  handleMultipleFiles(files);
};

const handleDragOver = (event: DragEvent) => {
  // We need to prevent default to allow drop
  event.preventDefault();
};

const updateImageField = (
  index: number,
  fieldName: keyof ImageInput,
  newValue: string
) => {
  const updatedImages = [...props.formValues.album.images];
  updatedImages[index] = {
    ...updatedImages[index],
    [fieldName]: newValue,
  };

  // Include imageOrder in the emit
  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: props.formValues.album.imageOrder,
    },
  });
  
  // Trigger auto-save
  debouncedAutoSave();
};

const deleteImage = (index: number) => {
  const updatedImages = [...props.formValues.album.images];
  updatedImages.splice(index, 1);

  // Update imageOrder after deletion
  const updatedImageOrder = updateImageOrderAfterChange(updatedImages);

  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });
  
  // Trigger auto-save
  debouncedAutoSave();
};

// Function to move image up in the order
const moveImageUp = (index: number) => {
  if (index <= 0) return; // Can't move up if it's the first item

  const updatedImages = [...props.formValues.album.images];
  // Swap with the item above
  [updatedImages[index], updatedImages[index - 1]] = [
    updatedImages[index - 1],
    updatedImages[index],
  ];

  // Update imageOrder after reordering
  const updatedImageOrder = updateImageOrderAfterChange(updatedImages);

  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });
  
  // Trigger auto-save
  debouncedAutoSave();
};

// Function to move image down in the order
const moveImageDown = (index: number) => {
  const images = props.formValues.album.images;
  if (index >= images.length - 1) return; // Can't move down if it's the last item

  const updatedImages = [...images];
  // Swap with the item below
  [updatedImages[index], updatedImages[index + 1]] = [
    updatedImages[index + 1],
    updatedImages[index],
  ];
  console.log("updatedImages", updatedImages);

  // Update imageOrder after reordering
  const updatedImageOrder = updateImageOrderAfterChange(updatedImages);
  console.log("updatedImageOrder", updatedImageOrder);

  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });
  
  // Trigger auto-save
  debouncedAutoSave();
};

type AddImageInput = {
  id?: string;
  url: string;
  alt: string;
  caption: string;
  copyright: string;
};

const updateImageOrderAfterChange = (images: ImageInput[]) => {
  // Map to just the IDs, filtering out any undefined IDs
  return images.map(img => img.id).filter(id => id !== undefined);
};

// Function to show URL input form
const showUrlInputForm = () => {
  if (isImageLimitReached.value) {
    alert(`You've reached the maximum limit of ${MAX_IMAGES} images.`);
    return;
  }
  showUrlInput.value = true;
  imageUrl.value = '';
  urlInputError.value = '';
  
  // Focus the input after it's rendered
  nextTick(() => {
    if (urlInputRef.value) {
      urlInputRef.value.focus();
    }
  });
};

// Function to cancel URL input
const cancelUrlInput = () => {
  showUrlInput.value = false;
  imageUrl.value = '';
  urlInputError.value = '';
};

// Function to validate and add image from URL
const addImageFromUrl = async () => {
  if (!imageUrl.value.trim()) {
    urlInputError.value = 'Please enter a valid URL';
    return;
  }
  
  // Basic URL validation
  try {
    new URL(imageUrl.value);
  } catch {
    urlInputError.value = 'Please enter a valid URL';
    return;
  }
  
  if (!usernameVar.value) {
    urlInputError.value = 'No username found, cannot create image.';
    return;
  }
  
  // Clear any previous errors
  urlInputError.value = '';
  isCreatingImageFromUrl.value = true;
  
  try {
    // Create the Image record in the database first
    const createImageResult = await createImage({
      url: imageUrl.value.trim(),
      alt: '',              // Empty alt text by default
      caption: '',          // Empty caption by default
      copyright: '',        // Empty copyright by default
      username: usernameVar.value
    });
    
    // Get the created image from the result
    const createdImage = createImageResult?.data?.createImages?.images?.[0];
    
    if (!createdImage || !createdImage.id) {
      throw new Error('Failed to create image record in database');
    }
    
    // Add the image to our album using the addNewImage helper
    addNewImage({
      id: createdImage.id,
      url: createdImage.url,
      alt: createdImage.alt || '',
      caption: createdImage.caption || '',
      copyright: createdImage.copyright || ''
    });
    
    // Reset form
    showUrlInput.value = false;
    imageUrl.value = '';
    urlInputError.value = '';
  } catch (err) {
    console.error('Error creating image from URL:', err);
    urlInputError.value = 'Failed to create image. Please try again.';
  } finally {
    isCreatingImageFromUrl.value = false;
  }
};

/**
 * Adds an image to the album, either from upload or manual URL entry
 */
const addNewImage = (input: Partial<AddImageInput>) => {
  if ((props.formValues.album?.images?.length ?? 0) >= MAX_IMAGES) {
    alert(`You've reached the maximum limit of ${MAX_IMAGES} images.`);
    return;
  }

  const { url, alt, caption, copyright, id } = input;

  const newImage: ImageInput = {
    id: id, // May be undefined for manual entries
    url: url || '',
    alt: alt || '',
    caption: caption || '', 
    copyright: copyright || '',
  };

  const updatedImages = [...props.formValues.album.images, newImage];

  // Update the imageOrder if this image has an ID
  const updatedImageOrder = [...props.formValues.album.imageOrder];
  if (id) {
    updatedImageOrder.push(id);
  }

  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder
    },
  });
  
  // Trigger auto-save
  debouncedAutoSave();
};

// Auto-save functionality
const getAlbumUpdateInput = () => {
  const albumData = props.formValues.album;
  if (!albumData || (!albumData.images?.length && !albumData.imageOrder?.length)) {
    return {}; // No album data to update
  }

  const albumId = props.existingAlbum?.id;
  
  // If the album doesn't exist yet, CREATE it and connect to existing images
  if (!albumId) {
    const newImages = albumData.images || [];
    
    // Filter out images without IDs
    const validImages = newImages.filter(img => img.id);
    
    if (validImages.length === 0) {
      return {}; // No valid images to connect
    }
    
    return {
      Album: {
        create: {
          node: {
            imageOrder: albumData.imageOrder || [],
            Images: {
              connect: validImages.map(img => ({
                where: { node: { id: img.id } }
              }))
            },
          },
        },
      },
    };
  }

  // If the album already exists, build the connect/update/disconnect arrays
  const oldImages = props.existingAlbum?.Images ?? [];
  const newImages = albumData.images || [];

  // CONNECT array: new images that need to be connected to this album
  const connectImageArray = newImages
    .filter((img) => img.id && !oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      connect: [{
        where: { node: { id: img.id } }
      }]
    }));

  // UPDATE array: existing images that need updates (only if properties changed)
  const updateImageArray = newImages
    .filter((img) => {
      if (!img.id) return false;
      const oldImage = oldImages.find((old) => old.id === img.id);
      if (!oldImage) return false;
      
      // Only update if properties have actually changed
      return (
        oldImage.url !== img.url ||
        oldImage.alt !== img.alt ||
        oldImage.caption !== img.caption ||
        oldImage.copyright !== img.copyright
      );
    })
    .map((img) => ({
      where: { node: { id: img.id } },
      update: {
        node: {
          url: img.url,
          alt: img.alt,
          caption: img.caption,
          copyright: img.copyright,
        },
      },
    }));
    
  // DISCONNECT array: old images that are no longer present
  const disconnectImageArray = oldImages
    .filter((old) => !newImages.some((img) => img.id === old.id))
    .map((old) => ({
      disconnect: [{
        where: { node: { id: old.id } },
      }]
    }));
    
  // Combine all operations
  const imagesOps = [
    ...connectImageArray,
    ...updateImageArray,
    ...disconnectImageArray,
  ];

  return {
    Album: {
      update: {
        node: {
          imageOrder: albumData.imageOrder || [],
          Images: imagesOps,
        },
      },
    },
  };
};

const performAutoSave = async () => {
  if (!props.discussionId) {
    return;
  }

  try {
    isAutoSaving.value = true;
    autoSaveSuccess.value = false;

    const albumUpdateInput = getAlbumUpdateInput();
    
    if (Object.keys(albumUpdateInput).length === 0) {
      return;
    }

    await updateDiscussion({
      where: { id: props.discussionId },
      updateDiscussionInput: albumUpdateInput,
    });

    autoSaveSuccess.value = true;
    
    // Hide success indicator after 2 seconds
    setTimeout(() => {
      autoSaveSuccess.value = false;
    }, 2000);

  } catch (error) {
    console.error('Auto-save failed:', error);
  } finally {
    isAutoSaving.value = false;
  }
};

const debouncedAutoSave = () => {
  // Only auto-save if we have a discussionId (edit mode)
  if (!props.discussionId) {
    return;
  }

  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  // Set new timeout for debounced save
  autoSaveTimeout = setTimeout(() => {
    performAutoSave();
  }, 500); // 500ms debounce
};

</script>

<template>
  <div class="border p-2 rounded-md dark:border-gray-600">
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
    <ErrorBanner
      v-if="createImageError"
      :text="createImageError.message"
    />
    <ErrorBanner
      v-if="updateDiscussionError"
      :text="updateDiscussionError.message"
    />
    
    <!-- Auto-save indicators -->
    <div v-if="isAutoSaving || autoSaveSuccess" class="mb-2 flex items-center gap-2">
      <LoadingSpinner v-if="isAutoSaving" class="h-4 w-4" />
      <span v-if="isAutoSaving" class="text-sm text-blue-600 dark:text-blue-400">Saving album...</span>
      <span v-else-if="autoSaveSuccess" class="text-sm text-green-600 dark:text-green-400">✓ Album saved</span>
    </div>
    
    <div v-if="loadingStates[-1]" class="mb-2 flex items-center gap-2">
      <LoadingSpinner />
      <span v-if="uploadStatus" class="text-sm text-gray-600 dark:text-gray-300">{{ uploadStatus }}</span>
    </div>
    <div class="mb-2">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ props.formValues.album?.images?.length ?? 0 }}/{{ MAX_IMAGES }}
        images
      </p>
    </div>
    <div
      v-for="(image, index) in props.formValues.album.images"
      :key="image?.id || `temp-${index}`"
      class="mb-4 border-b py-2"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <span class="font-bold dark:text-white">Image {{ index + 1 }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="ml-4 flex gap-1">
            <button
              type="button"
              class="rounded border border-gray-300 px-2 py-1 text-gray-700 dark:text-gray-200 dark:border-gray-600"
              :disabled="index === 0"
              :class="{ 'opacity-50 cursor-not-allowed': index === 0 }"
              @click="moveImageUp(index)"
            >
              ↑
            </button>
            <button
              type="button"
              class="rounded border border-gray-300 px-2 py-1 text-gray-700 dark:text-gray-200 dark:border-gray-600"
              :disabled="index === (formValues.album?.images?.length || 0) - 1"
              :class="{
                'opacity-50 cursor-not-allowed':
                  index === (formValues.album?.images?.length || 0) - 1,
              }"
              @click="moveImageDown(index)"
            >
              ↓
            </button>
          </div>
          <button
            type="button"
            class="rounded border border-gray-500 dark:border-gray-600 px-2 py-1 text-gray-500 dark:text-gray-200 flex items-center gap-1"
            @click="deleteImage(index)"
          >
            <XmarkIcon class="h-4" />
            Delete
          </button>
        </div>
      </div>
      <LoadingSpinner v-if="loadingStates[index]" class="mb-2" />

      <div :class="[mdAndDown ? 'flex-col' : 'flex', 'gap-2']">
        <div>
          <ExpandableImage
            v-if="image.url"
            class="w-72 object-cover"
            :src="image.url"
            :alt="image.alt"
          />
        </div>
        <div class="flex-col flex-1">
          <FormRow section-title="Image URL">
            <template #content>
              <TextInput
                :value="image.url"
                placeholder="https://example.com/my-image.jpg"
                @update="(val) => updateImageField(index, 'url', val)"
              />
            </template>
          </FormRow>
          <FormRow section-title="Alt Text">
            <template #content>
              <TextInput
                :value="image.alt"
                placeholder="Describe the image for accessibility"
                @update="(val) => updateImageField(index, 'alt', val)"
              />
            </template>
          </FormRow>
          <FormRow section-title="Caption">
            <template #content>
              <TextInput
                :value="image.caption"
                placeholder="Short caption or description"
                @update="(val) => updateImageField(index, 'caption', val)"
              />
            </template>
          </FormRow>
          <FormRow section-title="Attribution/Copyright">
            <template #content>
              <TextInput
                :value="image.copyright"
                placeholder="Who took this photo? (optional)"
                @update="(val) => updateImageField(index, 'copyright', val)"
              />
            </template>
          </FormRow>
        </div>
      </div>
    </div>
    <div
      v-if="!isImageLimitReached"
      class="my-3 border-2 border-dotted border-gray-400 p-4 text-center cursor-pointer rounded-md"
      @drop="handleDrop"
      @dragover="handleDragOver"
    >
      <label for="album-file-input" class="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        <p class="text-sm text-gray-500 dark:text-gray-300 mb-3">
          Drag and drop, tap to add files, or paste a link to an image
        </p>
        <div class="flex items-center gap-4 text-black">
          <button 
            type="button" 
            class="px-4 py-2 bg-orange-500 rounded hover:bg-orange-600 transition-colors"
            @click="selectFiles"
          >
            Choose Files
          </button>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <button 
            type="button" 
            class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            @click="showUrlInputForm"
          >
            Link to Image
          </button>
        </div>
      </label>
      <input
        id="album-file-input"
        ref="albumFileInputRef"
        type="file"
        multiple
        accept="image/*"
        style="display: none"
        @change="handleFileInputChange"
      >
    </div>
    <div
      v-else
      class="my-3 border-2 border-dotted border-gray-300 p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-md opacity-70"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Maximum limit of {{ MAX_IMAGES }} images reached
      </p>
    </div>
    
    <!-- URL Input Form -->
    <div v-if="showUrlInput" class="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Image from URL</h3>
      <div class="mb-3">
        <FormRow section-title="Image URL">
          <template #content>
            <TextInput
              ref="urlInputRef"
              :value="imageUrl"
              placeholder="https://example.com/image.jpg or https://example.com/model.glb"
              @update="(val) => imageUrl = val"
            />
          </template>
        </FormRow>
        <p v-if="urlInputError" class="text-red-500 text-sm mt-1">{{ urlInputError }}</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
          :disabled="!isUrlValid || isCreatingImageFromUrl"
          :class="{ 'opacity-50 cursor-not-allowed': !isUrlValid || isCreatingImageFromUrl }"
          @click="addImageFromUrl"
        >
          <LoadingSpinner v-if="isCreatingImageFromUrl" class="h-4 w-4" />
          {{ isCreatingImageFromUrl ? 'Creating...' : 'Add Image' }}
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          @click="cancelUrlInput"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
