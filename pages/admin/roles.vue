<script setup lang="ts">
import { computed } from "vue";
import { GET_SERVER_PERMISSIONS } from "@/graphQLData/admin/queries";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import { useQuery } from "@vue/apollo-composable";
import { config } from "@/config";
import PermissionsList from "@/components/admin/PermissionsList.vue";

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
    fetchPolicy: "cache-first",
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
        <div class="space-y-6 max-w-2xl" v-if="serverConfig">
          <div class="mb-6">
            <h1 class="text-2xl font-bold mb-2">Server Roles</h1>
            <p class="text-gray-600 dark:text-gray-300">
              These are the default roles for your server. They cannot be edited
              yet, but are included here for documentation purposes.
            </p>
          </div>

          <!-- Default Server Role -->
          <div v-if="serverConfig.DefaultServerRole" class="mb-6">
            <h2 class="text-lg font-semibold border-b pb-2">
              Default Server Role
            </h2>
            <hr class="mb-4" >
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 class="font-medium">
                {{ serverConfig.DefaultServerRole.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
                {{ serverConfig.DefaultServerRole.description }}
              </p>
              <PermissionsList :permissions="serverConfig.DefaultServerRole" />
            </div>
          </div>

          <!-- Default Mod Role -->
          <div v-if="serverConfig.DefaultModRole" class="mb-6">
            <h2 class="text-lg font-semibold border-b pb-2">
              Default Moderator Role
            </h2>
            <hr class="mb-4" >
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 class="font-medium">{{ serverConfig.DefaultModRole.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
                {{ serverConfig.DefaultModRole.description }}
              </p>
              <PermissionsList :permissions="serverConfig.DefaultModRole" />
            </div>
          </div>

          <!-- Default Channel Role -->
          <div v-if="serverConfig.DefaultChannelRole" class="mb-6">
            <h2 class="text-lg font-semibold border-b pb-2">
              Default Channel Role
            </h2>
            <hr class="mb-4" >
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 class="font-medium">
                {{ serverConfig.DefaultChannelRole.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
                {{ serverConfig.DefaultChannelRole.description }}
              </p>
              <PermissionsList :permissions="serverConfig.DefaultChannelRole" />
            </div>
          </div>

          <!-- Default Mod Channel Role -->
          <div v-if="serverConfig.DefaultModChannelRole" class="mb-6">
            <h2 class="text-lg font-semibold border-b pb-2">
              Default Moderator Channel Role
            </h2>
            <hr class="mb-4" >
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 class="font-medium">
                {{ serverConfig.DefaultModChannelRole.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
                {{ serverConfig.DefaultModChannelRole.description }}
              </p>
              <PermissionsList :permissions="serverConfig.DefaultModChannelRole" />
            </div>
          </div>
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