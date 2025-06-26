<script setup lang="ts">
import { computed } from "vue";
import CheckBox from "@/components/CheckBox.vue";
import FileTypePicker from "@/components/FileTypePicker.vue";

const props = defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updateFormValues"]);

const downloadsEnabled = computed(() => {
  return props.formValues.downloadsEnabled !== false;
});

const selectedFileTypes = computed(() => {
  return props.formValues.allowedFileTypes || [];
});

const updateDownloadsEnabled = (enabled: boolean) => {
  emit("updateFormValues", { downloadsEnabled: enabled });
};

const updateAllowedFileTypes = (fileTypes: string[]) => {
  emit("updateFormValues", { allowedFileTypes: fileTypes });
};
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Downloads Settings
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Configure download functionality for this forum.
      </p>
    </div>
    
    <!-- Enable Downloads Section -->
    <div class="space-y-4">
      <div class="flex items-center space-x-2">
        <CheckBox
          :checked="downloadsEnabled"
          @update="updateDownloadsEnabled"
        />
        <label class="text-sm font-medium text-gray-900 dark:text-white">
          Enable downloads tab in this forum
        </label>
      </div>
      
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Allow users to create and share download posts in this forum. Downloads must also be enabled at the server level.
      </p>
    </div>

    <!-- File Types Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Allowed File Types
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select which file types users can upload in this forum. Only file types enabled at the server level are available.
        </p>
      </div>
      
      <FileTypePicker
        :selected-file-types="selectedFileTypes"
        :disabled="!downloadsEnabled"
        :description="downloadsEnabled ? 'Choose from the file types configured on the server:' : 'Enable downloads above to configure file types.'"
        @set-selected-file-types="updateAllowedFileTypes"
      />
      
      <div v-if="!downloadsEnabled" class="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> File type selection is disabled because downloads are not enabled for this forum.
        </p>
      </div>
      
      <div v-else-if="selectedFileTypes.length === 0" class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Warning:</strong> No file types are selected. Users will not be able to upload any files until you select at least one file type.
        </p>
      </div>
    </div>
  </div>
</template>