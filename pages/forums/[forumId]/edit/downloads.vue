<script setup lang="ts">
import { computed } from "vue";
import CheckBox from "@/components/CheckBox.vue";
import FileTypePicker from "@/components/FileTypePicker.vue";
import FilterGroupManager from "@/components/filter/FilterGroupManager.vue";
import InfoBanner from "@/components/InfoBanner.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { FilterGroup } from "@/__generated__/graphql";
import { useQuery } from "@vue/apollo-composable";
import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
import { config } from "@/config";

const props = defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updateFormValues"]);

// Get server config to check if downloads are enabled server-wide
const { result: serverConfigResult, loading: serverConfigLoading, error: serverConfigError } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const serverConfig = computed(() => {
  return serverConfigResult.value?.serverConfigs?.[0] || null;
});

const serverDownloadsEnabled = computed(() => {
  return Boolean(serverConfig.value?.enableDownloads);
});

const serverAllowedFileTypes = computed(() => {
  return serverConfig.value?.allowedFileTypes || [];
});

const downloadsEnabled = computed(() => {
  return props.formValues.downloadsEnabled === true;
});

const selectedFileTypes = computed(() => {
  return props.formValues.allowedFileTypes || [];
});

const downloadFilterGroups = computed(() => {
  return props.formValues.downloadFilterGroups || [];
});

// Disable the checkbox if server downloads are disabled
const downloadCheckboxDisabled = computed(() => {
  return !serverDownloadsEnabled.value;
});

// Show warning if server downloads disabled
const showServerDisabledWarning = computed(() => {
  return !serverConfigLoading.value && !serverDownloadsEnabled.value;
});

const updateDownloadsEnabled = (enabled: boolean) => {
  // Only allow enabling if server downloads are enabled
  if (enabled && !serverDownloadsEnabled.value) {
    return;
  }
  emit("updateFormValues", { downloadsEnabled: enabled });
};

const updateAllowedFileTypes = (fileTypes: string[]) => {
  emit("updateFormValues", { allowedFileTypes: fileTypes });
};

const updateFilterGroups = (filterGroups: FilterGroup[]) => {
  emit("updateFormValues", { downloadFilterGroups: filterGroups });
};
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="serverConfigLoading" class="text-center py-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">Loading server configuration...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="serverConfigError">
      <ErrorBanner :text="'Unable to load server configuration: ' + serverConfigError.message" />
    </div>
    
    <!-- Main Content -->
    <div v-else>
      <div>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          Downloads Settings
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure download functionality for this forum.
        </p>
      </div>
      
      <!-- Server Disabled Warning -->
      <div v-if="showServerDisabledWarning">
        <ErrorBanner 
          text="Downloads are disabled at the server level. The downloads tab cannot be enabled for this forum until downloads are enabled in the server configuration by an administrator." 
        />
      </div>
      
      <!-- Enable Downloads Section -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <CheckBox
            :checked="downloadsEnabled"
            :disabled="downloadCheckboxDisabled"
            @update="updateDownloadsEnabled"
          />
          <label 
            class="text-sm font-medium"
            :class="{
              'text-gray-900 dark:text-white': !downloadCheckboxDisabled,
              'text-gray-400 dark:text-gray-500': downloadCheckboxDisabled
            }"
          >
            Enable downloads tab in this forum
          </label>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span v-if="serverDownloadsEnabled">
            Allow users to create and share download posts in this forum.
          </span>
          <span v-else class="text-red-600 dark:text-red-400">
            Downloads must be enabled at the server level before they can be enabled for individual forums.
          </span>
        </p>
      </div>
    </div>

    <!-- File Types Section (only show if server config loaded) -->
    <div v-if="!serverConfigLoading && !serverConfigError" class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Allowed File Types
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          <span v-if="serverDownloadsEnabled">
            Select which file types users can upload in this forum. Only file types enabled at the server level are available.
          </span>
          <span v-else class="text-red-600 dark:text-red-400">
            File type configuration is not available because downloads are disabled at the server level.
          </span>
        </p>
      </div>
      
      <FileTypePicker
        v-if="serverDownloadsEnabled"
        :selected-file-types="selectedFileTypes"
        :disabled="!downloadsEnabled || !serverDownloadsEnabled"
        :description="downloadsEnabled && serverDownloadsEnabled ? 'Choose from the file types configured on the server:' : 'Enable downloads above to configure file types.'"
        @set-selected-file-types="updateAllowedFileTypes"
      />
      
      <div v-if="!serverDownloadsEnabled" class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <p class="text-sm text-red-600 dark:text-red-400">
          <strong>Note:</strong> File type configuration is disabled because downloads are not enabled at the server level.
        </p>
      </div>
      
      <div v-else-if="!downloadsEnabled" class="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> File type selection is disabled because downloads are not enabled for this forum.
        </p>
      </div>
      
      <div v-else-if="selectedFileTypes.length === 0" class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Warning:</strong> No file types are selected. Users will not be able to upload any files until you select at least one file type.
        </p>
      </div>
      
      <div v-if="serverAllowedFileTypes.length === 0 && serverDownloadsEnabled" class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Server Configuration Issue:</strong> No file types are configured at the server level. Contact an administrator to configure allowed file types in the server settings.
        </p>
      </div>
    </div>

    <!-- Filter Configuration Section (only show if server config loaded) -->
    <div v-if="!serverConfigLoading && !serverConfigError" class="space-y-4">
      <div class="border-t border-gray-200 pt-6 dark:border-gray-600">
        <FilterGroupManager
          :filter-groups="downloadFilterGroups"
          :disabled="!downloadsEnabled || !serverDownloadsEnabled"
          @update-filter-groups="updateFilterGroups"
        />
      </div>
    </div>
  </div>
</template>