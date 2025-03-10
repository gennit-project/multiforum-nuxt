<script lang="ts" setup>
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import { usernameVar } from "@/cache";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";
import TextInput from "@/components/TextInput.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue"; // Assuming you have this
// If you don't, remove or implement your own spinner

const props = defineProps<{
  formValues: {
    album: {
      images: {
        id?: string;
        url: string;
        alt: string;
        caption?: string;
        copyright?: string;
      }[];
      imageOrder: string[];
    };
  };
  allowImageUpload?: boolean;
}>();

const emit = defineEmits(["updateFormValues"]);

type ImageInput = {
  id?: string;
  url: string;
  alt: string;
  copyright?: string;
  caption?: string;
};

// GraphQL Mutation to get the signed storage URL
const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
  useMutation(CREATE_SIGNED_STORAGE_URL);

// Keep track of which item is uploading or done
const loadingStates = ref<{ [key: number]: boolean }>({});

/**
 * Upload a single file and return the final link or null on failure.
 */
const uploadFile = async (file: File): Promise<string | null> => {
  if (!usernameVar.value) {
    console.error("No username found, cannot upload.");
    return null;
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

    // Actually upload the file using the signed URL
    const finalLink = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: contentType,
      signedStorageURL,
    });
    if (!finalLink) {
      throw new Error("No final link returned");
    }
    return finalLink;
  } catch (err) {
    console.error("Error uploading file:", err);
    return null;
  }
};

/**
 * Given multiple files, sequentially upload them and
 * add them to the album array as new images.
 */
const handleMultipleFiles = async (files: FileList | File[]) => {
  if (!files || files.length === 0) return;

  // Optionally you can show a global loading spinner,
  // or track loading for each file. We'll do a quick approach
  // by turning on "global" loading in a single key:
  loadingStates.value[-1] = true;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Upload each file
    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      // Insert a new image object into the album
      addNewImage({
        url: uploadedUrl,
        alt: file.name,
      });
    }
  }

  // Turn off the global loading
  loadingStates.value[-1] = false;
};

// ------------------------------------
//  Handling the drop zone
// ------------------------------------

const albumFileInputRef = ref<HTMLInputElement | null>(null);

const selectFiles = () => {
  // Programmatically trigger file input click
  if (albumFileInputRef.value) {
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
  console.log("Dropped files:", event.dataTransfer?.files);
  if (props.allowImageUpload === false) return;
  console.log("Uploading files...");
  if (!event.dataTransfer?.files?.length) return;
  console.log("Handling files...");

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
  emit("updateFormValues", { album: { images: updatedImages } });
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

  // Update imageOrder after reordering
  const updatedImageOrder = updateImageOrderAfterChange(updatedImages);

  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });
};

// Helper function to update imageOrder based on the current image array
const updateImageOrderAfterChange = (images: ImageInput[]) => {
  // Create imageOrder from image IDs, filtering out undefined IDs
  return images
    .map((img) => img.id)
    .filter((id): id is string => id !== undefined);
};

type AddImageInput = {
  url: string;
  alt: string;
  caption?: string;
  copyright?: string;
};

const addNewImage = (input: AddImageInput) => {
  const { url, alt, caption, copyright } = input;

  const newImage = {
    url,
    alt,
    copyright,
    caption,
  } as ImageInput;

  const updatedImages = [...props.formValues.album.images, newImage];

  // Update imageOrder after adding a new image
  const updatedImageOrder = updateImageOrderAfterChange(updatedImages);

  emit("updateFormValues", {
    album: {
      images: updatedImages,
      imageOrder: updatedImageOrder,
    },
  });
};

const imageMap = computed<Record<string, ImageInput>>(() => {
  const images = props.formValues.album.images;
  const imageOrder = props.formValues.album.imageOrder || [];
  const imageOrderMap: Record<string, ImageInput> = {};

  imageOrder.forEach((imageId) => {
    const imageAtIndex = images.find((img) => img.id === imageId);
    if (imageAtIndex) {
      imageOrderMap[imageId] = imageAtIndex;
    }
  });

  return imageOrderMap;
});
</script>

<template>
  <div class="border p-2 rounded-md dark:border-gray-600">
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
    <div v-if="loadingStates[-1]" class="mb-2">
      <LoadingSpinner />
    </div>
    <div
      v-for="(imageId, index) in formValues.album?.imageOrder || []"
      :key="imageId ?? index"
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

      <div>
        <ExpandableImage
          v-if="imageMap[imageId]?.url"
          class="w-72 object-cover"
          :src="imageMap[imageId].url"
          :alt="imageMap[imageId].alt"
        />
      </div>
      <TextInput
        class="mt-2"
        label="Image URL"
        :value="imageMap[imageId]?.url || ''"
        placeholder="https://example.com/my-image.jpg"
        :full-width="true"
        @update="(val) => updateImageField(index, 'url', val)"
      />
      <TextInput
        class="mt-2"
        label="Caption"
        :value="imageMap[imageId]?.caption"
        placeholder="Short caption or description"
        :full-width="true"
        @update="
          (val) => {
            updateImageField(index, 'caption', val);
            updateImageField(index, 'alt', val);
          }
        "
      />
      <TextInput
        class="mt-2"
        label="Attribution/Copyright"
        :value="imageMap[imageId]?.copyright"
        placeholder="Who took this photo? (optional)"
        :full-width="true"
        @update="(val) => updateImageField(index, 'copyright', val)"
      />
    </div>
    <div
      class="my-3 border-2 border-dotted border-gray-400 p-4 text-center cursor-pointer rounded-md"
      @click="selectFiles"
      @drop="handleDrop"
      @dragover="handleDragOver"
    >
      <p class="text-sm text-gray-500 dark:text-gray-300">
        Drag and drop, or click to add files
      </p>
      <input
        ref="albumFileInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFileInputChange"
      />
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
