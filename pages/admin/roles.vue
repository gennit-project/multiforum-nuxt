<script setup lang="ts">
import { computed } from 'vue';
import { GET_SERVER_PERMISSIONS } from '@/graphQLData/admin/queries';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useQuery } from '@vue/apollo-composable';
import { config } from '@/config';
import DefaultRolesEditor from '@/components/admin/DefaultRolesEditor.vue';
import ModChannelRolesEditor from '@/components/admin/ModChannelRolesEditor.vue';

const {
  result: getServerResult,
  error: getServerError,
  loading: getServerLoading,
} = useQuery(
  GET_SERVER_PERMISSIONS,
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
  <div class="px-8 dark:text-white">
    <RequireAuth :loading="getServerLoading">
      <template #has-auth>
        <div v-if="serverConfig" class="max-w-4xl space-y-8">
          <div class="mb-6">
            <h1 class="mb-2 text-2xl font-bold">Server Roles</h1>
            <p class="text-gray-600 dark:text-gray-300">
              These are the default roles for your server. Edit the defaults
              below, and adjust channel-specific moderator roles afterward.
            </p>
          </div>

          <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Standard User Roles
            </h2>
            <DefaultRolesEditor
              :server-config="serverConfig"
              :types="['server']"
              :title="'Standard User Roles'"
              :show-title="false"
            />
          </section>

          <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Mod Roles
            </h2>
            <DefaultRolesEditor
              :server-config="serverConfig"
              :types="['mod']"
              :title="'Mod Roles'"
              :show-title="false"
            />
            <div class="pt-2">
              <ModChannelRolesEditor />
            </div>
          </section>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="p-8 dark:text-white">
          You don't have permission to see this page.
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
