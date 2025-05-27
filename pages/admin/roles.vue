<script setup lang="ts">
import { computed } from "vue";
import { GET_SERVER_PERMISSIONS } from "@/graphQLData/admin/queries";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import { useQuery } from "@vue/apollo-composable";
import { config } from "@/config";
import RoleSection from "@/components/admin/RoleSection.vue";

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
        <div v-if="serverConfig" class="space-y-6 max-w-2xl">
          <div class="mb-6">
            <h1 class="text-2xl font-bold mb-2">Server Roles</h1>
            <p class="text-gray-600 dark:text-gray-300">
              These are the default roles for your server. They cannot be edited
              yet, but are included here for documentation purposes.
            </p>
          </div>
          <RoleSection
            v-if="serverConfig.DefaultServerRole"
            :section-title="'Default Server Role'"
            :role-title="serverConfig.DefaultServerRole.name"
            :role-description="serverConfig.DefaultServerRole.description"
            :permissions="serverConfig.DefaultServerRole"
          />
          <RoleSection
            v-if="serverConfig.DefaultModRole"
            :section-title="'Default Mod Role'"
            :role-title="serverConfig.DefaultModRole.name"
            :role-description="serverConfig.DefaultModRole.description"
            :permissions="serverConfig.DefaultModRole"
          />
          <RoleSection
            v-if="serverConfig.DefaultElevatedModRole"
            :section-title="'Default Elevated Mod Role'"
            :role-title="serverConfig.DefaultElevatedModRole.name"
            :role-description="serverConfig.DefaultElevatedModRole.description"
            :permissions="serverConfig.DefaultElevatedModRole"
          />
          <RoleSection
            v-if="serverConfig.DefaultSuspendedRole"
            :section-title="'Default Suspended Role'"
            :role-title="serverConfig.DefaultSuspendedRole.name"
            :role-description="serverConfig.DefaultSuspendedRole.description"
            :permissions="serverConfig.DefaultSuspendedRole"
          />
          <RoleSection
            v-if="serverConfig.DefaultSuspendedModRole"
            :section-title="'Default Suspended Mod Role'"
            :role-title="serverConfig.DefaultSuspendedModRole.name"
            :role-description="serverConfig.DefaultSuspendedModRole.description"
            :permissions="serverConfig.DefaultSuspendedModRole"
          />
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
