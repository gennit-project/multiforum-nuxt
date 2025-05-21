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
        <div
          v-if="serverConfig"
          class="max-w-2xl space-y-6"
        >
          <div class="mb-6">
            <h1 class="mb-2 text-2xl font-bold">Server Roles</h1>
            <p class="text-gray-600 dark:text-gray-300">
              These are the default roles for your server. They cannot be edited yet, but are
              included here for documentation purposes.
            </p>
          </div>
          <RoleSection
            v-if="serverConfig.DefaultServerRole"
            :permissions="serverConfig.DefaultServerRole"
            :role-description="serverConfig.DefaultServerRole.description"
            :role-title="serverConfig.DefaultServerRole.name"
            :section-title="'Default Server Role'"
          />
          <RoleSection
            v-if="serverConfig.DefaultModRole"
            :permissions="serverConfig.DefaultModRole"
            :role-description="serverConfig.DefaultModRole.description"
            :role-title="serverConfig.DefaultModRole.name"
            :section-title="'Default Mod Role'"
          />
          <RoleSection
            v-if="serverConfig.DefaultElevatedModRole"
            :permissions="serverConfig.DefaultElevatedModRole"
            :role-description="serverConfig.DefaultElevatedModRole.description"
            :role-title="serverConfig.DefaultElevatedModRole.name"
            :section-title="'Default Elevated Mod Role'"
          />
          <RoleSection
            v-if="serverConfig.DefaultSuspendedRole"
            :permissions="serverConfig.DefaultSuspendedRole"
            :role-description="serverConfig.DefaultSuspendedRole.description"
            :role-title="serverConfig.DefaultSuspendedRole.name"
            :section-title="'Default Suspended Role'"
          />
          <RoleSection
            v-if="serverConfig.DefaultSuspendedModRole"
            :permissions="serverConfig.DefaultSuspendedModRole"
            :role-description="serverConfig.DefaultSuspendedModRole.description"
            :role-title="serverConfig.DefaultSuspendedModRole.name"
            :section-title="'Default Suspended Mod Role'"
          />
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="p-8 dark:text-white">You don't have permission to see this page.</div>
      </template>
    </RequireAuth>
  </div>
</template>
