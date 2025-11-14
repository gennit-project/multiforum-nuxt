<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import DownloadList from '@/components/channel/DownloadList.vue';
import DownloadFilterBar from '@/components/download/DownloadFilterBar.vue';
import DownloadFilters from '@/components/download/DownloadFilters.vue';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import type { FilterGroup } from '@/__generated__/graphql';
import { config } from '@/config';
import { DateTime } from 'luxon';
import { useAsyncQuery } from '@nuxtjs/apollo/dist/runtime/composables';

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const {
  data: channelData,
  pending: channelLoading,
  error: channelError,
} = await useAsyncQuery(
  GET_CHANNEL,
  {
    uniqueName: channelId,
    now: DateTime.local().startOf('hour').toISO(),
  },
  'default',
  void 0,
  {
    watch: [channelId],
  }
);

const {
  data: serverConfigData,
  pending: serverConfigLoading,
  error: serverConfigError,
} = await useAsyncQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  'default'
);

const channel = computed(() => channelData.value?.channels?.[0]);

const serverConfig = computed(() => {
  return serverConfigData.value?.serverConfigs?.[0] || null;
});

const serverDownloadsEnabled = computed(() => {
  return Boolean(serverConfig.value?.enableDownloads);
});

const channelDownloadsEnabled = computed(() => {
  return channel.value?.downloadsEnabled !== false;
});

const bothLoading = computed(() => {
  return channelLoading.value || serverConfigLoading.value;
});

const anyError = computed(() => {
  return channelError.value || serverConfigError.value;
});

const shouldShowDownloads = computed(() => {
  return (
    !bothLoading.value &&
    !anyError.value &&
    serverDownloadsEnabled.value &&
    channelDownloadsEnabled.value
  );
});

const errorMessage = computed(() => {
  if (anyError.value) {
    return 'Unable to load forum or server configuration.';
  }

  if (!serverDownloadsEnabled.value) {
    return 'Cannot show downloads because they are disabled at the server level.';
  }

  if (!channelDownloadsEnabled.value) {
    return 'Cannot show downloads because they are not enabled for this forum.';
  }

  return '';
});

const filterGroups = computed<FilterGroup[]>(() => {
  return channel.value?.FilterGroups || [];
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="bothLoading" class="flex justify-center py-8">
      <div class="text-center">
        <p class="text-gray-600 dark:text-gray-400">Loading downloads...</p>
      </div>
    </div>

    <!-- Error or Disabled State -->
    <div v-else-if="!shouldShowDownloads" class="px-4 py-8">
      <div class="mx-auto max-w-md text-center">
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          Downloads Not Available
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          {{ errorMessage }}
        </p>
        <div
          v-if="!channelDownloadsEnabled && serverDownloadsEnabled"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          Contact the forum administrators to enable downloads for this forum.
        </div>
        <div
          v-else-if="!serverDownloadsEnabled"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          Contact the server administrators to enable downloads server-wide.
        </div>
      </div>
    </div>

    <!-- Downloads Content -->
    <div v-else>
      <DownloadFilterBar :filter-groups="filterGroups" />

      <!-- Desktop Layout with Sidebar -->
      <div class="hidden lg:flex">
        <!-- Left Sidebar for Filters -->
        <div v-if="filterGroups.length > 0" class="w-64 flex-shrink-0 pr-6">
          <div class="sticky top-4">
            <DownloadFilters :filter-groups="filterGroups" :is-sidebar="true" />
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="min-w-0 flex-1">
          <DownloadList :filter-groups="filterGroups" />
        </div>
      </div>

      <!-- Mobile Layout (no sidebar) -->
      <div class="lg:hidden">
        <DownloadList :filter-groups="filterGroups" />
      </div>
    </div>
  </div>
</template>
