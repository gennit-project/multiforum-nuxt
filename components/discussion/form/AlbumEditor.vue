<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
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
        attribution?: string;
      }[];
    };
  };
  allowImageUpload?: boolean;
}>();

const emit = defineEmits(["updateFormValues"]);

type ImageInput = {
  id?: string;
  url: string;
  alt: string;
  attribution?: string;
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
  console.log("Handling multiple files...");
  if (!files || files.length === 0) return;

  // Optionally you can show a global loading spinner,
  // or track loading for each file. We'll do a quick approach
  // by turning on "global" loading in a single key:
  loadingStates.value[-1] = true; 

  for (let i = 0; i < files.length; i++) {
    console.log("Uploading file", i);
    const file = files[i];
    // Upload each file
    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      // Insert a new image object into the album
      addNewImage(uploadedUrl, file.name);
    }
  }

  // Turn off the global loading
  loadingStates.value[-1] = false;
};

// ------------------------------------
//  Handling the drop zone
// ------------------------------------

const fileInputRef = ref<HTMLInputElement | null>(null);

const selectFiles = () => {
  // Programmatically trigger file input click
  if (fileInputRef.value) {
    fileInputRef.value.click();
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
  emit("updateFormValues", { album: { images: updatedImages } });
};

/**
 * Adds a brand new image entry to the album. If you pass
 * a URL, it sets that automatically. Otherwise, it’s blank.
 */
const addNewImage = (url = "", alt = "") => {
  const updatedImages = [
    ...props.formValues.album.images,
    {
      url,
      alt,
      attribution: "",
    },
  ];
  emit("updateFormValues", { album: { images: updatedImages } });
};
</script>

<template>
  <div class="border p-2 rounded-md dark:border-gray-600">
    <!-- If there's a GraphQL error, show it -->
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
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
        ref="fileInputRef"
        type="file"
        multiple
        style="display: none"
        @change="handleFileInputChange"
      >
    </div>
    <div v-if="loadingStates[-1]" class="mb-2">
      <LoadingSpinner />
    </div>
    <div
      v-for="(image, index) in formValues.album?.images || []"
      :key="image.id ?? index"
      class="mb-4 border-b py-2"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold dark:text-white">Image {{ index + 1 }}</span>
        <button
          type="button"
          class="rounded border border-blue-500 px-2 py-1 text-blue-500 flex items-center gap-1"
          @click="deleteImage(index)"
        >
          <XmarkIcon class="h-4" />
          Delete
        </button>
      </div>
      <LoadingSpinner v-if="loadingStates[index]" class="mb-2" />
      <TextInput
        class="mt-2"
        label="Image URL"
        :value="image.url"
        placeholder="https://example.com/my-image.jpg"
        :full-width="true"
        @update="(val) => updateImageField(index, 'url', val)"
      />
      <div>
        <img
          v-if="image.url"
          :src="image.url"
          :alt="image.alt"
          class="max-w-full h-32 mt-2 object-cover"
        >
      </div>
      <TextInput
        class="mt-2"
        label="Alt (short description)"
        :value="image.alt"
        placeholder="Alt text / short description"
        :full-width="true"
        @update="(val) => updateImageField(index, 'alt', val)"
      />
      <TextInput
        class="mt-2"
        label="Attribution"
        :value="image.attribution"
        placeholder="Who took this photo? (optional)"
        :full-width="true"
        @update="(val) => updateImageField(index, 'attribution', val)"
      />
    </div>

    <!-- If you still want a button to add a blank image entry: -->
    <!--
    <button
      type="button"
      class="mt-2 rounded border border-blue-500 px-2 py-1 text-blue-500"
      @click="addNewImage"
    >
      + Add New Image
    </button>
    -->
  </div>
</template>
