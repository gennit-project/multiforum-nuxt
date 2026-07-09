<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable';
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { config } from '@/config';
import ServerTabs from '@/components/admin/ServerTabs.vue';
import ServerIssueSplitView from '@/components/mod/ServerIssueSplitView.vue';

const route = useRoute();
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
  return getServerResult.value?.serverConfigs?.[0] || null;
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
        <ServerIssueSplitView :show-detail-pane="showIssueDetailPane">
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
        </ServerIssueSplitView>
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
