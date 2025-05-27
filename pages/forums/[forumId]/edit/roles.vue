<script setup lang="ts">
import { computed } from "vue";
import { GET_SERVER_PERMISSIONS } from "@/graphQLData/admin/queries";
import { useQuery } from "@vue/apollo-composable";
import { config } from "@/config";
import RoleSection from "@/components/admin/RoleSection.vue";

const {
  result: getServerResult,
  error: getServerError,
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
    <div v-if="serverConfig" class="space-y-6 max-w-2xl">
      <div class="mb-6">
        <h1 class="text-xl font-bold mb-2">Forum Roles</h1>
        <p class="text-gray-600 text-sm dark:text-gray-400">
          These are the default roles for your forum. They cannot be edited yet,
          but are included here for documentation purposes.
        </p>
      </div>
      <RoleSection
        v-if="serverConfig.DefaultServerRole"
        :section-title="'Role for New Users'"
        :role-description="'Anyone who has not been suspended at the server scope or the forum scope can do these actions by default.'"
        :permissions="serverConfig.DefaultServerRole"
      />
      <RoleSection
        v-if="serverConfig.DefaultModRole"
        :section-title="'Minimal Mod Role'"
        :role-description="'Mod profiles that have not been suspended at the server scope or the forum scope can do these actions by default.'"
        :permissions="serverConfig.DefaultModRole"
      />
      <RoleSection
        v-if="serverConfig.DefaultElevatedModRole"
        :section-title="'Elevated Mod Role'"
        :role-description="'Mods that have been explicitly added to the list of moderators for this forum can do these actions.'"
        :permissions="serverConfig.DefaultElevatedModRole"
      />
      <RoleSection
        v-if="serverConfig.DefaultSuspendedRole"
        :section-title="'Suspended Role'"
        :role-description="'This role is for users who have been suspended at the server scope, or at the scope of this forum.'"
        :permissions="serverConfig.DefaultSuspendedRole"
      />
      <RoleSection
        v-if="serverConfig.DefaultSuspendedModRole"
        :section-title="'Suspended Mod Role'"
        :role-description="'This role is for mods who have been suspended at the server scope, or at the scope of this forum.'"
        :permissions="serverConfig.DefaultSuspendedModRole"
      />
    </div>
  </div>
</template>
