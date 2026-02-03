<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable';
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { config } from '@/config';
import ServerTabs from '@/components/admin/ServerTabs.vue';
import IssueDetail from '@/components/mod/IssueDetail.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const uiStore = useUIStore();
const { selectedIssueNumber, selectedIssueTitle, selectedIssueChannelId } =
  storeToRefs(uiStore);
const { result: getServerResult, error: getServerError } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const serverConfig = computed(() => {
  if (getServerError.value || !getServerResult.value?.serverConfigs) {
    return null;
  }
  return getServerResult.value?.serverConfigs[0] || null;
});

const isSettingsPage = computed(() => {
  const routeName = route.name?.toString() || '';
  return (
    routeName.includes('admin-settings') || routeName.includes('admin-plugins')
  );
});

const showIssueDetailPane = computed(() => {
  const routeName = route.name?.toString() || '';
  return routeName === 'admin-issues' || routeName === 'admin-issues-closed';
});
</script>

<template>
  <NuxtLayout>
    <div v-if="serverConfig" class="flex w-full flex-1 justify-center">
      <article
        class="w-full max-w-screen-2xl rounded-lg focus:outline-none dark:bg-black"
      >
        <div class="relative w-full">
          <div
            class="flex flex-col divide-x dark:divide-gray-500 md:flex-row"
            :class="showIssueDetailPane ? 'lg:h-[calc(100vh-3.5rem)]' : ''"
          >
            <div
              :class="
                showIssueDetailPane
                  ? 'min-w-0 flex-1 lg:w-1/2 lg:overflow-y-auto'
                  : 'w-full'
              "
              class="p-4 md:p-6"
            >
              <ServerTabs
                class="mb-2 w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
                :vertical="false"
                :show-counts="true"
                :route="route"
                :server-config="serverConfig"
                :desktop="false"
              />
              <div class="max-w-full">
                <NuxtPage />
              </div>
            </div>
            <div
              v-if="showIssueDetailPane"
              class="hidden lg:flex lg:w-1/2 lg:overflow-y-auto"
            >
              <div
                v-if="selectedIssueNumber && selectedIssueChannelId"
                class="flex w-full flex-col rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <h2
                      v-if="selectedIssueTitle"
                      class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                      {{ selectedIssueTitle }}
                    </h2>
                  </div>
                  <a
                    :href="`/forums/${selectedIssueChannelId}/issues/${selectedIssueNumber}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                  >
                    Open in new tab
                  </a>
                </div>
                <IssueDetail
                  :channel-id="selectedIssueChannelId"
                  :issue-number="selectedIssueNumber"
                />
              </div>
              <div
                v-else
                class="w-full rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
              >
                Select an issue to view details.
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="mx-4 my-6 flex-1 flex-col items-center">
      <h1 class="text-2xl font-bold">Server not found</h1>
      <p class="text-gray-500 dark:text-gray-400">
        Could not find the server configuration.
      </p>
    </div>
  </NuxtLayout>
</template>
