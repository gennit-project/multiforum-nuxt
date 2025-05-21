<script setup lang="ts">
  import { computed } from "vue";
  import { GET_SERVER_PERMISSIONS } from "@/graphQLData/admin/queries";
  import { useQuery } from "@vue/apollo-composable";
  import { config } from "@/config";
  import RoleSection from "@/components/admin/RoleSection.vue";

  const { result: getServerResult, error: getServerError } = useQuery(
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
    <div
      v-if="serverConfig"
      class="max-w-2xl space-y-6"
    >
      <div class="mb-6">
        <h1 class="mb-2 text-xl font-bold">Forum Roles</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          These are the default roles for your forum. They cannot be edited yet, but are included
          here for documentation purposes.
        </p>
      </div>
      <RoleSection
        v-if="serverConfig.DefaultServerRole"
        :permissions="serverConfig.DefaultServerRole"
        :role-description="'Anyone who has not been suspended at the server scope or the forum scope can do these actions by default.'"
        :section-title="'Role for New Users'"
      />
      <RoleSection
        v-if="serverConfig.DefaultModRole"
        :permissions="serverConfig.DefaultModRole"
        :role-description="'Mod profiles that have not been suspended at the server scope or the forum scope can do these actions by default.'"
        :section-title="'Minimal Mod Role'"
      />
      <RoleSection
        v-if="serverConfig.DefaultElevatedModRole"
        :permissions="serverConfig.DefaultElevatedModRole"
        :role-description="'Mods that have been explicitly added to the list of moderators for this forum can do these actions.'"
        :section-title="'Elevated Mod Role'"
      />
      <RoleSection
        v-if="serverConfig.DefaultSuspendedRole"
        :permissions="serverConfig.DefaultSuspendedRole"
        :role-description="'This role is for users who have been suspended at the server scope, or at the scope of this forum.'"
        :section-title="'Suspended Role'"
      />
      <RoleSection
        v-if="serverConfig.DefaultSuspendedModRole"
        :permissions="serverConfig.DefaultSuspendedModRole"
        :role-description="'This role is for mods who have been suspended at the server scope, or at the scope of this forum.'"
        :section-title="'Suspended Mod Role'"
      />
    </div>
  </div>
</template>
