<script lang="ts" setup>
import { ref } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import { usernameVar } from "@/cache";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils"; 
import XmarkIcon from "@/components/icons/XmarkIcon.vue";
import TextInput from "@/components/TextInput.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import AddImage from "@/components/AddImage.vue";

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

// Main method that does the actual upload
const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error("No username found, cannot upload.");
    return null;
  }

  try {
    // Generate a unique filename on the server
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

const addNewImage = () => {
  const updatedImages = [
    ...props.formValues.album.images,
    // Provide default empty fields
    { url: "", alt: "", attribution: "" },
  ];
  emit("updateFormValues", { album: { images: updatedImages } });
};

// Keep track of which item to show the loading indicator next to
const loadingStates = ref<{ [key: string]: boolean }>({});

const handleFileChange = async (index: number, event: Event) => {
  if (props.allowImageUpload === false) return;

  const input = event.target as HTMLInputElement;
  if (!input?.files?.length) return;
  const file = input.files[0];

  // Set local "uploading" indicator here
  loadingStates.value[index] = true;

  const uploadedUrl = await upload(file);
  if (!uploadedUrl) return;

  // Store the final URL in the image data
  updateImageField(index, "url", uploadedUrl);
};
</script>

<template>
  <div class="border p-2 rounded-md dark:border-gray-600">
    <ErrorBanner
      v-if="createSignedStorageUrlError"
      :text="createSignedStorageUrlError.message"
    />
    <div v-for="(image, index) in formValues.album?.images || []" :key="image.id ?? index" class="mb-4 border-b py-2">
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
      <LoadingSpinner
        v-if="loadingStates[index]"
        class="mb-2"
      />
      <AddImage
        v-if="props.allowImageUpload !== false"
        :field-name="'album-image-' + index"
        label="Paste, drop, or click to add an image"
        @file-change="(inputEvent) => handleFileChange(index, inputEvent.event)"
      />
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
          class="max-w-full h-32 mt-2"
        />
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
    <button
      type="button"
      class="mt-2 rounded border border-blue-500 px-2 py-1 text-blue-500"
      @click="addNewImage"
    >
      + Add New Image
    </button>
  </div>
</template>
