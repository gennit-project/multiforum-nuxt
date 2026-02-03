<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { config } from '@/config';
import ServerSidebar from '@/components/admin/ServerSidebar.vue';

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
</script>

<template>
  <div class="w-full">
    <ServerSidebar
      v-if="serverConfig"
      :key="serverConfig.rules"
      :server-config="serverConfig"
      class="p-2"
    />
    <div v-else class="p-4 text-sm text-gray-500 dark:text-gray-400">
      Could not load server details.
    </div>
  </div>
</template>
