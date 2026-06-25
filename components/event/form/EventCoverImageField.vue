<script setup lang="ts">
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  getUploadFileName,
  uploadAndGetEmbeddedLink,
  isFileSizeValid,
} from '@/utils';
import { useUsername } from '@/composables/useAuthState';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import AddImage from '@/components/AddImage.vue';

defineProps<{
  imageUrl?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update', url: string): void;
}>();

type FileChangeInput = {
  event: Event;
  fieldName: string;
};

const usernameVar = useUsername();
const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);
const coverImageLoading = ref(false);

const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  const sizeCheck = isFileSizeValid({ file });
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return;
  }
  try {
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const signedUrlResult = await createSignedStorageUrl({
      filename,
      contentType: file.type,
    });

    const signedStorageURL =
      signedUrlResult?.data?.createSignedStorageURL?.url || '';
    const embeddedLink = uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: file.type,
      signedStorageURL,
    });

    return embeddedLink;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const handleCoverImageChange = async (input: FileChangeInput) => {
  if (!input.event || !input.event.target) {
    return;
  }
  const { event, fieldName } = input;
  const target = event?.target as HTMLInputElement;
  if (!target.files || !target.files[0]) {
    return;
  }
  const selectedFile = target.files[0];

  if (fieldName === 'coverImageURL' && selectedFile) {
    coverImageLoading.value = true;
    const embeddedLink = await upload(selectedFile);

    if (!embeddedLink) {
      coverImageLoading.value = false;
      return;
    }
    emit('update', embeddedLink);
    coverImageLoading.value = false;
  }
};

const removeImage = () => {
  emit('update', '');
};
</script>

<template>
  <div v-if="imageUrl" class="mb-3">
    <div
      class="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-600"
    >
      <img
        alt="Cover Image"
        :src="imageUrl"
        class="h-auto max-h-64 w-full object-cover"
      >

      <!-- Image overlay when loading -->
      <div
        v-if="coverImageLoading"
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div class="flex flex-col items-center text-white">
          <div class="h-8 w-8 text-white">
            <svg
              class="h-8 w-8 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke-dasharray="42"
                stroke-dashoffset="12"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <span class="mt-2">Uploading image...</span>
        </div>
      </div>
    </div>

    <!-- Image actions for when an image exists -->
    <div class="mt-2 flex space-x-2">
      <AddImage
        key="cover-image-replace"
        field-name="coverImageURL"
        label="Replace Image"
        :disabled="coverImageLoading"
        @file-change="handleCoverImageChange"
      />

      <button
        type="button"
        class="flex items-center text-sm text-red-500 hover:underline"
        :disabled="coverImageLoading"
        :class="{
          'cursor-not-allowed opacity-60': coverImageLoading,
        }"
        @click="removeImage"
      >
        <i class="fa fa-trash-can mr-2" /> Remove Image
      </button>
    </div>
  </div>

  <div
    v-else-if="coverImageLoading"
    class="bg-gray-50 mb-3 rounded-md border border-gray-200 p-6 dark:border-gray-600 dark:bg-gray-700"
  >
    <div
      class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-300"
    >
      <div class="h-8 w-8">
        <svg
          class="h-8 w-8 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke-dasharray="42"
            stroke-dashoffset="12"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <span>Uploading image...</span>
    </div>
  </div>

  <div v-else class="mb-3">
    <div
      class="bg-gray-50 rounded-md border border-dashed border-gray-300 p-8 text-center dark:border-gray-600 dark:bg-gray-800"
    >
      <i class="fa fa-image mb-3 text-3xl text-gray-400 dark:text-gray-500" />
      <span class="mb-3 block text-sm text-gray-500 dark:text-gray-400">
        No cover image uploaded
      </span>
      <div class="mt-2">
        <AddImage
          key="cover-image-url"
          field-name="coverImageURL"
          label="Add Cover Image"
          :disabled="coverImageLoading"
          @file-change="handleCoverImageChange"
        />
      </div>
    </div>
  </div>
</template>
