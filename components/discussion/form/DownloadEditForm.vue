<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import type { PropType } from 'vue';
import type {
  Discussion,
  DownloadableFile,
  DiscussionUpdateInput,
  DiscussionDownloadableFilesConnectFieldInput,
  DiscussionDownloadableFilesDisconnectFieldInput,
  DiscussionDownloadableFilesUpdateFieldInput,
  FilterGroup,
} from '@/__generated__/graphql';
// Using string literals instead of importing enums from massive generated file
import FormRow from '@/components/FormRow.vue';
import { useMutation } from '@vue/apollo-composable';
import ErrorBanner from '@/components/ErrorBanner.vue';
import {
  UPDATE_DISCUSSION,
  CREATE_SIGNED_STORAGE_URL,
  CREATE_DOWNLOADABLE_FILE,
} from '@/graphQLData/discussion/mutations';
import Notification from '@/components/NotificationComponent.vue';
import { uploadAndGetEmbeddedLink, getUploadFileName } from '@/utils';
import { usernameVar } from '@/cache';
import DownloadLabelPicker from '@/components/download/DownloadLabelPicker.vue';

const MAX_DOWNLOAD_FILE_SIZE_MB = 50;
const MAX_DOWNLOAD_FILE_SIZE_BYTES = MAX_DOWNLOAD_FILE_SIZE_MB * 1024 * 1024;

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
  // Channel data to get allowed file types and filter groups
  channelData: {
    type: Object as PropType<{
      allowedFileTypes?: string[];
      FilterGroups?: FilterGroup[];
    }>,
    default: () => ({ allowedFileTypes: [], FilterGroups: [] }),
  },
  // Accept existing download labels from parent
  existingDownloadLabels: {
    type: Object as PropType<Record<string, string[]>>,
    default: () => ({}),
  },
});

const emit = defineEmits(['closeEditor', 'updateFormValues']);

const downloadableFiles = computed(() => {
  if (!props.discussion?.DownloadableFiles) return [];
  return props.discussion.DownloadableFiles.map((file: DownloadableFile) => {
    return {
      id: file.id || '',
      fileName: file.fileName || '',
      url: file.url || '',
      kind: file.kind || 'OTHER',
      size: file.size || 0,
      license: file.license?.id || '',
      priceModel: file.priceModel || 'FREE',
      priceCents: file.priceCents || 0,
      priceCurrency: file.priceCurrency || 'USD',
    };
  });
});

// Form values
type DownloadFormFile = {
  id?: string;
  fileName: string;
  url: string;
  kind: string;
  size: number;
  license: string;
  priceModel: string;
  priceCents: number;
  priceCurrency: string;
};

const formValues = ref({
  downloadableFiles: [] as DownloadFormFile[],
  downloadLabels: {} as Record<string, string[]>,
});

// Upload state
const uploadingFile = ref(false);
const uploadError = ref('');

// Notification state
const savedSuccessfully = ref(false);

// License options (placeholder as requested)
const licenseOptions = [
  { id: 'mit', name: 'MIT License' },
  { id: 'apache-2', name: 'Apache License 2.0' },
  { id: 'gpl-3', name: 'GNU General Public License v3.0' },
  { id: 'bsd-3', name: 'BSD 3-Clause License' },
  { id: 'creative-commons', name: 'Creative Commons' },
  { id: 'proprietary', name: 'Proprietary' },
  { id: 'other', name: 'Other' },
];

// GraphQL mutations
const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
  useMutation(CREATE_SIGNED_STORAGE_URL);

const { mutate: createDownloadableFile, error: createDownloadableFileError } =
  useMutation(CREATE_DOWNLOADABLE_FILE);

const {
  mutate: _updateDiscussion,
  error: updateDiscussionError,
  onDone,
} = useMutation(UPDATE_DISCUSSION, () => ({
  variables: {
    where: { id: props.discussion.id },
    updateDiscussionInput: getUpdateDiscussionInputForDownloadableFiles(),
  },
}));

onDone(() => {
  emit('closeEditor');
});

// Generate accept attribute from channel allowed file types
const acceptAttribute = computed(() => {
  const allowedTypes = props.channelData?.allowedFileTypes || [];
  if (allowedTypes.length === 0) {
    return undefined; // No restriction if no types specified
  }

  // Convert file types to file extensions for accept attribute
  const extensions = allowedTypes.map((type) => {
    const lowerType = type.toLowerCase();
    // If it's already an extension (starts with .), use as-is
    if (lowerType.startsWith('.')) {
      return lowerType;
    }
    // Otherwise add a dot prefix
    return `.${lowerType}`;
  });

  return extensions.join(',');
});

// Initialize form values after component is mounted
onMounted(() => {

  formValues.value.downloadableFiles = [...downloadableFiles.value];

  // Initialize download labels from props
  formValues.value.downloadLabels = { ...props.existingDownloadLabels };

});

// File validation
const validateFileType = (file: File): { valid: boolean; message: string } => {
  const allowedTypes = props.channelData?.allowedFileTypes || [];

  if (allowedTypes.length === 0) {
    return { valid: true, message: '' };
  }

  const fileExtension = file.name.toLowerCase().split('.').pop();
  const isAllowed = allowedTypes.some(
    (type) =>
      type.toLowerCase().includes(fileExtension || '') ||
      file.type.toLowerCase().includes(type.toLowerCase())
  );

  if (!isAllowed) {
    return {
      valid: false,
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true, message: '' };
};

const validateFileSize = (file: File): { valid: boolean; message: string } => {
  if (file.size > MAX_DOWNLOAD_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: `File size must be less than ${MAX_DOWNLOAD_FILE_SIZE_MB}MB. Current file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
    };
  }
  return { valid: true, message: '' };
};

// File upload handling
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validate file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    uploadError.value = typeValidation.message;
    return;
  }

  uploadError.value = '';
  uploadingFile.value = true;

  try {
    const success = await uploadFile(file);

    if (!success) {
      // Error message is already set in uploadFile function
      console.error('Upload failed');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    uploadError.value =
      error instanceof Error ? error.message : 'Upload failed';
  } finally {
    uploadingFile.value = false;
    // Reset the input so user can re-upload the same file if needed
    (event.target as HTMLInputElement).value = '';
  }
};

/**
 * Adds a downloadable file to the form values
 */
const addNewFile = (fileData: DownloadFormFile) => {
  const updatedFiles = [...formValues.value.downloadableFiles, fileData];
  formValues.value.downloadableFiles = updatedFiles;
};

/**
 * Upload a single file and return success status.
 * This handles uploading the file to storage, creating the DownloadableFile record in the database,
 * and adding it to the form values.
 */
const uploadFile = async (file: File): Promise<boolean> => {
  if (!usernameVar.value) {
    console.error('No username found, cannot upload.');
    return false;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    uploadError.value = sizeValidation.message;
    return false;
  }

  try {
    // Generate a unique filename
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const fileType =
      file.type || getFileTypeFromName(file.name) || 'application/octet-stream';
    const signedStorageURLInput = { filename, contentType: fileType };

    // Ask the server for a signed storage URL
    const signedUrlResult = await createSignedStorageUrl(signedStorageURLInput);
    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    if (!signedStorageURL) {
      throw new Error('No signed storage URL returned');
    }

    // Upload the file using the signed URL
    const fileUrl = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType,
      signedStorageURL,
    });

    if (!fileUrl) {
      throw new Error('No file URL returned from upload');
    }

    // Now create the DownloadableFile record in the database
    const createFileResult = await createDownloadableFile({
      fileName: file.name,
      url: fileUrl,
      kind: getFileKind(file),
      size: file.size,
      priceModel: 'FREE',
      priceCents: 0,
      priceCurrency: 'USD',
    });

    // Get the created file from the result
    const createdFile =
      createFileResult?.data?.createDownloadableFiles?.downloadableFiles?.[0];

    if (!createdFile || !createdFile.id) {
      throw new Error('Failed to create downloadable file record in database');
    }

    // Add the file to our form values using the addNewFile helper
    addNewFile({
      id: createdFile.id,
      fileName: createdFile.fileName,
      url: createdFile.url,
      kind: createdFile.kind,
      size: createdFile.size,
      license: createdFile.license?.id || '',
      priceModel: createdFile.priceModel || 'FREE',
      priceCents: createdFile.priceCents || 0,
      priceCurrency: createdFile.priceCurrency || 'USD',
    });

    // Auto-save after successful file upload
    handleSave();

    return true;
  } catch (err) {
    console.error('Error uploading file and creating downloadable file:', err);
    uploadError.value = err instanceof Error ? err.message : 'Upload failed';
    return false;
  }
};

const getFileTypeFromName = (filename: string): string | null => {
  if (!filename) return null;

  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return null;

  const mimeTypes: Record<string, string> = {
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    exe: 'application/x-msdownload',
    dmg: 'application/x-apple-diskimage',
    pkg: 'application/x-newton-compatible-pkg',
    deb: 'application/vnd.debian.binary-package',
    rpm: 'application/x-rpm',
  };

  return mimeTypes[extension] || 'application/octet-stream';
};

const getFileKind = (file: File): string => {
  const extension = file.name.toLowerCase().split('.').pop();

  // Map to actual FileKind enum values: ZIP, RAR, PNG, JPG, BLEND, STL, GLB, OTHER
  if (extension === 'zip') {
    return 'ZIP';
  } else if (extension === 'rar') {
    return 'RAR';
  } else if (['png'].includes(extension || '')) {
    return 'PNG';
  } else if (['jpg', 'jpeg'].includes(extension || '')) {
    return 'JPG';
  } else if (extension === 'blend') {
    return 'BLEND';
  } else if (extension === 'stl') {
    return 'STL';
  } else if (extension === 'glb') {
    return 'GLB';
  }

  return 'OTHER';
};

// Remove file
const removeFile = (index: number) => {
  formValues.value.downloadableFiles.splice(index, 1);
  // Auto-save after file removal
  handleSave();
};

// Update license
const updateLicense = (fileIndex: number, licenseId: string) => {
  if (formValues.value.downloadableFiles[fileIndex]) {
    formValues.value.downloadableFiles[fileIndex].license = licenseId;
  }
};

function getUpdateDiscussionInputForDownloadableFiles(): DiscussionUpdateInput {
  // 1) If no downloadable files exist yet in the original discussion, CREATE connections
  if (
    !props.discussion?.DownloadableFiles ||
    props.discussion.DownloadableFiles?.length === 0
  ) {
    const newFiles = formValues.value.downloadableFiles || [];

    // Build connect array for new files
    const connectArray: DiscussionDownloadableFilesConnectFieldInput[] =
      newFiles
        .filter((file) => file.id) // Only connect files that have database IDs
        .map((file) => ({
          where: { node: { id: file.id } },
        }));

    return {
      hasDownload: newFiles.length > 0,
      DownloadableFiles:
        connectArray.length > 0
          ? [
              {
                connect: connectArray,
              },
            ]
          : undefined,
    };
  }

  // 2) If downloadable files already exist, we build the connect/disconnect arrays
  const oldFiles = props.discussion.DownloadableFiles ?? [];
  const newFiles = formValues.value.downloadableFiles;

  // CONNECT array: any new file in `newFiles` that has NO matching ID in `oldFiles`
  const connectArray: DiscussionDownloadableFilesConnectFieldInput[] = newFiles
    .filter((file) => file.id && !oldFiles.some((old) => old.id === file.id))
    .map((file) => ({
      where: { node: { id: file.id } },
    }));

  // DISCONNECT array: any old file that is no longer present in `newFiles`
  const disconnectArray: DiscussionDownloadableFilesDisconnectFieldInput[] =
    oldFiles
      .filter((old) => !newFiles.some((file) => file.id === old.id))
      .map((old) => ({
        where: { node: { id: old.id } },
      }));

  // Build the update field input object
  const updateFieldInput: DiscussionDownloadableFilesUpdateFieldInput = {};
  if (connectArray.length > 0) {
    updateFieldInput.connect = connectArray;
  }
  if (disconnectArray.length > 0) {
    updateFieldInput.disconnect = disconnectArray;
  }

  // Return the update input
  return {
    hasDownload: newFiles.length > 0,
    DownloadableFiles:
      Object.keys(updateFieldInput).length > 0 ? [updateFieldInput] : undefined,
  };
}

// For handling save
function handleSave() {
  // Always emit to parent - let the parent decide how to handle the save
  emit('updateFormValues', {
    downloadableFiles: formValues.value.downloadableFiles,
    downloadLabels: formValues.value.downloadLabels,
  });

  // Only show success notification if we're in temp-id mode (create/embedded mode)
  if (props.discussion.id === 'temp-id') {
    savedSuccessfully.value = true;
    setTimeout(() => {
      savedSuccessfully.value = false;
    }, 3000); // Hide after 3 seconds
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 mt-3 flex w-full flex-col">
      <ErrorBanner v-if="uploadError" :text="uploadError" class="mb-4" />

      <ErrorBanner
        v-else-if="createSignedStorageUrlError"
        :text="createSignedStorageUrlError.message"
        class="mb-4"
      />

      <ErrorBanner
        v-else-if="createDownloadableFileError"
        :text="createDownloadableFileError.message"
        class="mb-4"
      />

      <!-- File Upload Section -->
      <FormRow section-title="File Upload" :required="true">
        <template #content>
          <div class="space-y-4">
            <div v-if="formValues.downloadableFiles.length === 0">
              <input
                id="downloadable-file-input"
                type="file"
                class="hidden"
                :accept="acceptAttribute"
                :disabled="uploadingFile"
                @change="handleFileUpload"
              >
              <label
                for="downloadable-file-input"
                class="hover:bg-gray-50 focus:ring-indigo-500 inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                :class="{ 'cursor-not-allowed opacity-50': uploadingFile }"
              >
                <span v-if="uploadingFile">Uploading...</span>
                <span v-else>Choose File</span>
              </label>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Maximum file size: {{ MAX_DOWNLOAD_FILE_SIZE_MB }}MB
                <br >
                <span v-if="channelData?.allowedFileTypes?.length">
                  Allowed file types:
                  {{ channelData.allowedFileTypes.join(', ') }}
                </span>
              </p>
            </div>

            <!-- Display uploaded files -->
            <div
              v-if="formValues.downloadableFiles.length > 0"
              class="space-y-4"
            >
              <div
                v-for="(file, index) in formValues.downloadableFiles"
                :key="index"
                class="rounded-lg border border-gray-200 p-4 dark:border-gray-600"
              >
                <div class="mb-3 flex items-center justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">
                      {{ file.fileName }}
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{
                        file.size
                          ? (file.size / (1024 * 1024)).toFixed(2)
                          : '0'
                      }}MB • {{ file.kind }}
                    </p>
                    <!-- Show URL for existing files (non-editable) -->
                    <div v-if="file.url" class="mt-2">
                      <label
                        class="text-xs font-medium text-gray-700 dark:text-gray-300"
                        >File URL:</label
                      >
                      <div class="mt-1 flex items-center gap-2">
                        <input
                          :value="file.url"
                          readonly
                          class="bg-gray-50 flex-1 cursor-not-allowed rounded border border-gray-200 px-2 py-1 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          type="text"
                        >
                        <button
                          type="button"
                          class="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete this file"
                          @click="removeFile(index)"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <!-- For newly uploaded files without URL yet, show regular Remove button -->
                  <button
                    v-if="!file.url"
                    type="button"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    @click="removeFile(index)"
                  >
                    Remove
                  </button>
                </div>

                <!-- License Selection -->
                <FormRow section-title="License">
                  <template #content>
                    <select
                      :value="file.license"
                      class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      @change="
                        updateLicense(
                          index,
                          ($event.target as HTMLSelectElement).value
                        )
                      "
                    >
                      <option value="">Select a license...</option>
                      <option
                        v-for="license in licenseOptions"
                        :key="license.id"
                        :value="license.id"
                      >
                        {{ license.name }}
                      </option>
                    </select>
                  </template>
                </FormRow>
              </div>

              <!-- Option to add another file -->
              <div>
                <input
                  id="additional-file-input"
                  type="file"
                  class="hidden"
                  :accept="acceptAttribute"
                  :disabled="uploadingFile"
                  @change="handleFileUpload"
                >
                <label
                  for="additional-file-input"
                  class="hover:bg-gray-50 inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  :class="{ 'cursor-not-allowed opacity-50': uploadingFile }"
                >
                  <span v-if="uploadingFile">Uploading...</span>
                  <span v-else>+ Add Another File</span>
                </label>
              </div>
            </div>
          </div>
        </template>
      </FormRow>

      <!-- Download Labels Section -->
      <FormRow
        v-if="channelData?.FilterGroups && channelData.FilterGroups.length > 0"
        section-title="Labels"
        class="mt-6"
      >
        <template #content>
          <DownloadLabelPicker
            :filter-groups="channelData.FilterGroups || []"
            :selected-labels="formValues.downloadLabels"
            @update:selected-labels="
              (newLabels) => {
                formValues.downloadLabels = newLabels;
                // Emit the changes to parent immediately
                handleSave();
              }
            "
          />
        </template>
      </FormRow>
    </div>

    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />

    <Notification
      :show="savedSuccessfully"
      :title="'Download saved successfully'"
      @close-notification="savedSuccessfully = false"
    />
  </div>
</template>
