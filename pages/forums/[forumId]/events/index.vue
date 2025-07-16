<script setup lang="ts">
import { computed } from "vue";
import EventListView from "@/components/event/list/EventListView.vue";
import InfoBanner from "@/components/InfoBanner.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
import { useRoute } from "nuxt/app";
import { config } from "@/config";
import { DateTime } from "luxon";

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

// Get channel data to check if events are enabled for this forum
const { result: getChannelResult, loading: channelLoading, error: channelError } = useQuery(
  GET_CHANNEL,
  {
    uniqueName: channelId,
    now: DateTime.local().startOf("hour").toISO(),
  },
  {
    fetchPolicy: "cache-first",
    enabled: !!channelId.value,
  }
);

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

const channel = computed(() => {
  return getChannelResult.value?.channels?.[0] || null;
});

const serverConfig = computed(() => {
  return serverConfigResult.value?.serverConfigs?.[0] || null;
});

const serverEventsEnabled = computed(() => {
  return Boolean(serverConfig.value?.enableEvents);
});

const channelEventsEnabled = computed(() => {
  return channel.value?.eventsEnabled !== false;
});

const bothLoading = computed(() => {
  return channelLoading.value || serverConfigLoading.value;
});

const anyError = computed(() => {
  return channelError.value || serverConfigError.value;
});

const shouldShowEvents = computed(() => {
  return !bothLoading.value && !anyError.value && serverEventsEnabled.value && channelEventsEnabled.value;
});

const errorMessage = computed(() => {
  if (anyError.value) {
    return "Unable to load forum or server configuration.";
  }
  
  if (!serverEventsEnabled.value) {
    return "Cannot show the calendar because events are disabled at the server level.";
  }
  
  if (!channelEventsEnabled.value) {
    return "Cannot show the calendar because it is not enabled for this forum.";
  }
  
  return "";
});
</script>
<template>
  <div>
    <!-- Loading State -->
    <div v-if="bothLoading" class="flex justify-center py-8">
      <div class="text-center">
        <p class="text-gray-600 dark:text-gray-400">Loading calendar...</p>
      </div>
    </div>
    
    <!-- Error or Disabled State -->
    <div v-else-if="!shouldShowEvents" class="px-4 py-8">
      <div class="max-w-md mx-auto text-center">
        <div class="mb-4">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Calendar Not Available
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ errorMessage }}
        </p>
        <div v-if="!channelEventsEnabled && serverEventsEnabled" class="text-sm text-gray-500 dark:text-gray-400">
          Contact the forum administrators to enable events for this forum.
        </div>
        <div v-else-if="!serverEventsEnabled" class="text-sm text-gray-500 dark:text-gray-400">
          Contact the server administrators to enable events server-wide.
        </div>
      </div>
    </div>
    
    <!-- Events List -->
    <EventListView v-else />
  </div>
</template>
