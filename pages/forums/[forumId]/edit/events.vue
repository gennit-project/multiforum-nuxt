<script setup lang="ts">
import { computed } from "vue";
import CheckBox from "@/components/CheckBox.vue";
import InfoBanner from "@/components/InfoBanner.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
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

// Get server config to check if events are enabled server-wide
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

const serverEventsEnabled = computed(() => {
  return Boolean(serverConfig.value?.enableEvents);
});

const eventsEnabled = computed(() => {
  return props.formValues.eventsEnabled !== false;
});

// Disable the checkbox if server events are disabled
const eventCheckboxDisabled = computed(() => {
  return !serverEventsEnabled.value;
});

// Show warning if server events disabled
const showServerDisabledWarning = computed(() => {
  return !serverConfigLoading.value && !serverEventsEnabled.value;
});

const updateEventsEnabled = (enabled: boolean) => {
  // Only allow enabling if server events are enabled
  if (enabled && !serverEventsEnabled.value) {
    return;
  }
  emit("updateFormValues", { eventsEnabled: enabled });
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
          Events Settings
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure event functionality for this forum.
        </p>
      </div>
      
      <!-- Server Disabled Warning -->
      <div v-if="showServerDisabledWarning">
        <ErrorBanner 
          text="Events are disabled at the server level. The events/calendar tab cannot be enabled for this forum until events are enabled in the server configuration by an administrator." 
        />
      </div>
      
      <!-- Enable Events Section -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <CheckBox
            :checked="eventsEnabled"
            :disabled="eventCheckboxDisabled"
            @update="updateEventsEnabled"
          />
          <label 
            class="text-sm font-medium"
            :class="{
              'text-gray-900 dark:text-white': !eventCheckboxDisabled,
              'text-gray-400 dark:text-gray-500': eventCheckboxDisabled
            }"
          >
            Enable events/calendar tab in this forum
          </label>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span v-if="serverEventsEnabled">
            Allow users to create and share events in this forum.
          </span>
          <span v-else class="text-red-600 dark:text-red-400">
            Events must be enabled at the server level before they can be enabled for individual forums.
          </span>
        </p>
      </div>
    </div>
  </div>
</template>