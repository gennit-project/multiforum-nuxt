<script lang="ts" setup>
  import { ref, computed } from "vue";
  import { useMutation } from "@vue/apollo-composable";
  import { CREATE_SIGNED_STORAGE_URL, CREATE_IMAGE } from "@/graphQLData/discussion/mutations";
  import { usernameVar } from "@/cache";
  import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
  import XmarkIcon from "@/components/icons/XmarkIcon.vue";
  import TextInput from "@/components/TextInput.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
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
  const { mutate: createImage, error: createImageError } = useMutation(CREATE_IMAGE);

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
        alt: file.name, // Default to filename for alt text
        caption: "", // Empty caption by default
        copyright: "", // Empty copyright by default
        username: usernameVar.value,
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
        copyright: createdImage.copyright || "",
      });

      return true;
    } catch (err) {
      console.error("Error uploading file and creating image:", err);
      return false;
    }
  };

  // Status message for upload feedback
  const uploadStatus = ref("");

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
        uploadStatus.value = `Uploading ${i + 1}/${filesToProcess.length} images...`;
        const success = await uploadFile(file);
        if (success) successCount++;
      }

      uploadStatus.value = `Successfully uploaded ${successCount} image${successCount !== 1 ? "s" : ""}.`;
      setTimeout(() => {
        uploadStatus.value = "";
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
        uploadStatus.value = `Uploading ${i + 1}/${filesArray.length} images...`;
        const success = await uploadFile(file);
        if (success) successCount++;
      }

      uploadStatus.value = `Successfully uploaded ${successCount} image${successCount !== 1 ? "s" : ""}.`;
      setTimeout(() => {
        uploadStatus.value = "";
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

  const updateImageField = (index: number, fieldName: keyof ImageInput, newValue: string) => {
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
    return images.map((img) => img.id).filter((id) => id !== undefined);
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
      url: url || "",
      alt: alt || "",
      caption: caption || "",
      copyright: copyright || "",
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
        imageOrder: updatedImageOrder,
      },
    });
  };
</script>

<template>
  <div class="rounded-md border p-2 dark:border-gray-600">
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
    <ErrorBanner
      v-if="createImageError"
      :text="createImageError.message"
    />
    <div
      v-if="loadingStates[-1]"
      class="mb-2 flex items-center gap-2"
    >
      <LoadingSpinner />
      <span
        v-if="uploadStatus"
        class="text-sm text-gray-600 dark:text-gray-300"
        >{{ uploadStatus }}</span
      >
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
      <div class="mb-2 flex items-center justify-between">
        <div class="flex items-center">
          <span class="font-bold dark:text-white">Image {{ index + 1 }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="ml-4 flex gap-1">
            <button
              class="rounded border border-gray-500 px-2 py-1 text-gray-700 dark:border-gray-600 dark:text-gray-200"
              :class="{ 'cursor-not-allowed opacity-50': index === 0 }"
              :disabled="index === 0"
              type="button"
              @click="moveImageUp(index)"
            >
              ↑
            </button>
            <button
              class="rounded border border-gray-500 px-2 py-1 text-gray-700 dark:border-gray-600 dark:text-gray-200"
              :class="{
                'cursor-not-allowed opacity-50':
                  index === (formValues.album?.images?.length || 0) - 1,
              }"
              :disabled="index === (formValues.album?.images?.length || 0) - 1"
              type="button"
              @click="moveImageDown(index)"
            >
              ↓
            </button>
          </div>
          <button
            class="flex items-center gap-1 rounded border border-gray-500 px-2 py-1 text-gray-500 dark:border-gray-600 dark:text-gray-200"
            type="button"
            @click="deleteImage(index)"
          >
            <XmarkIcon class="h-4" />
            Delete
          </button>
        </div>
      </div>
      <LoadingSpinner
        v-if="loadingStates[index]"
        class="mb-2"
      />

      <div :class="[mdAndDown ? 'flex-col' : 'flex', 'gap-2']">
        <div>
          <ExpandableImage
            v-if="image.url"
            :alt="image.alt"
            class="w-72 object-cover"
            :src="image.url"
          />
        </div>
        <div class="flex-1 flex-col gap-2">
          <TextInput
            class="mt-2"
            :full-width="true"
            label="Image URL"
            placeholder="https://example.com/my-image.jpg"
            :value="image.url"
            @update="(val) => updateImageField(index, 'url', val)"
          />
          <TextInput
            class="mt-2"
            :full-width="true"
            label="Caption"
            placeholder="Short caption or description"
            :value="image.caption"
            @update="(val) => updateImageField(index, 'caption', val)"
          />
          <TextInput
            class="mt-2"
            :full-width="true"
            label="Attribution/Copyright"
            placeholder="Who took this photo? (optional)"
            :value="image.copyright"
            @update="(val) => updateImageField(index, 'copyright', val)"
          />
        </div>
      </div>
    </div>
    <div
      v-if="!isImageLimitReached"
      class="my-3 cursor-pointer rounded-md border-2 border-dotted border-gray-400 p-4 text-center"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <label
        class="flex h-full w-full cursor-pointer flex-col items-center justify-center"
        for="album-file-input"
      >
        <p class="mb-2 text-sm text-gray-500 dark:text-gray-300">
          Drag and drop, or tap to add files
        </p>
        <button
          class="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          type="button"
          @click="selectFiles"
        >
          Choose Files
        </button>
      </label>
      <input
        id="album-file-input"
        ref="albumFileInputRef"
        accept="image/*"
        multiple
        style="display: none"
        type="file"
        @change="handleFileInputChange"
      />
    </div>
    <div
      v-else
      class="bg-gray-50 my-3 rounded-md border-2 border-dotted border-gray-500 p-4 text-center opacity-70 dark:bg-gray-800"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Maximum limit of {{ MAX_IMAGES }} images reached
      </p>
    </div>
    <!-- <button
      type="button"
      class="mt-2 rounded border border-blue-500 px-2 py-1 text-blue-500"
      @click="() => addNewImage()"
    >
      + Add New Image
    </button> -->
  </div>
</template>
