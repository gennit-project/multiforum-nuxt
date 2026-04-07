<script setup lang="ts">
import { computed } from 'vue';
import { GET_SERVER_PERMISSIONS } from '@/graphQLData/admin/queries';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useQuery } from '@vue/apollo-composable';
import { config } from '@/config';
import { DateTime } from 'luxon';
import RoleSection from '@/components/admin/RoleSection.vue';
import ModChannelRolesEditor from '@/components/admin/ModChannelRolesEditor.vue';
import ServerMembershipEditor from '@/components/admin/ServerMembershipEditor.vue';

const {
  result: getServerResult,
  error: getServerError,
  loading: getServerLoading,
  refetch: refetchServerConfig,
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

const suspendedUsers = computed(() => serverConfig.value?.SuspendedUsers ?? []);
const suspendedMods = computed(() => serverConfig.value?.SuspendedMods ?? []);

const humanReadableDate = (dateISO?: string | null): string => {
  if (!dateISO) {
    return 'Unknown date';
  }

  return DateTime.fromISO(dateISO).toLocaleString(DateTime.DATETIME_MED);
};
</script>

<template>
  <div class="px-8 dark:text-white">
    <RequireAuth :loading="getServerLoading">
      <template #has-auth>
        <div v-if="serverConfig" class="max-w-4xl space-y-8">
          <div class="mb-6">
            <h1 class="mb-2 text-2xl font-bold">Server Roles</h1>
            <p class="text-gray-600 dark:text-gray-300">
              These are the default roles for your server. They are included
              here for documentation, and channel-specific moderator roles can
              be edited below.
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
          <ServerMembershipEditor
            v-if="serverConfig"
            :server-config="serverConfig"
            :on-updated="refetchServerConfig"
          />
          <div class="space-y-6">
            <div>
              <h2 class="mb-2 text-xl font-bold">Server-Suspended Users</h2>
              <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
                These are the active server-scoped user suspensions. Follow the
                related issue to reverse a suspension.
              </p>
              <div
                v-if="suspendedUsers.length === 0"
                class="text-sm text-gray-600 dark:text-gray-300"
              >
                There are no active server-scoped user suspensions.
              </div>
              <div v-else class="space-y-2 text-sm">
                <div
                  v-for="suspension in suspendedUsers"
                  :key="suspension.id"
                  class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div class="flex flex-col gap-1">
                    <nuxt-link
                      :to="{
                        name: 'u-username',
                        params: {
                          username:
                            suspension.SuspendedUser?.username ??
                            suspension.username,
                        },
                      }"
                      class="font-semibold dark:text-white"
                    >
                      {{
                        suspension.SuspendedUser?.displayName ??
                        suspension.SuspendedUser?.username ??
                        suspension.username
                      }}
                    </nuxt-link>
                    <div class="text-gray-500 dark:text-gray-300">
                      {{
                        suspension.suspendedIndefinitely
                          ? `Suspended indefinitely as of ${humanReadableDate(
                              suspension.createdAt
                            )}`
                          : `Suspended until ${humanReadableDate(
                              suspension.suspendedUntil
                            )}`
                      }}
                    </div>
                  </div>
                  <nuxt-link
                    v-if="suspension.RelatedIssue?.issueNumber"
                    :to="{
                      name: 'admin-issues-issueNumber',
                      params: { issueNumber: suspension.RelatedIssue.issueNumber },
                    }"
                    class="rounded border border-orange-500 px-2 py-1 text-orange-500"
                  >
                    Related Issue
                  </nuxt-link>
                </div>
              </div>
            </div>
            <div>
              <h2 class="mb-2 text-xl font-bold">Server-Suspended Mods</h2>
              <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
                These are the active server-scoped moderator suspensions.
              </p>
              <div
                v-if="suspendedMods.length === 0"
                class="text-sm text-gray-600 dark:text-gray-300"
              >
                There are no active server-scoped mod suspensions.
              </div>
              <div v-else class="space-y-2 text-sm">
                <div
                  v-for="suspension in suspendedMods"
                  :key="suspension.id"
                  class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div class="flex flex-col gap-1">
                    <nuxt-link
                      :to="{
                        name: 'mod-modId',
                        params: {
                          modId:
                            suspension.SuspendedMod?.displayName ??
                            suspension.modProfileName,
                        },
                      }"
                      class="font-semibold dark:text-white"
                    >
                      {{
                        suspension.SuspendedMod?.displayName ??
                        suspension.modProfileName
                      }}
                    </nuxt-link>
                    <div class="text-gray-500 dark:text-gray-300">
                      {{
                        suspension.suspendedIndefinitely
                          ? `Suspended indefinitely as of ${humanReadableDate(
                              suspension.createdAt
                            )}`
                          : `Suspended until ${humanReadableDate(
                              suspension.suspendedUntil
                            )}`
                      }}
                    </div>
                  </div>
                  <nuxt-link
                    v-if="suspension.RelatedIssue?.issueNumber"
                    :to="{
                      name: 'admin-issues-issueNumber',
                      params: { issueNumber: suspension.RelatedIssue.issueNumber },
                    }"
                    class="rounded border border-orange-500 px-2 py-1 text-orange-500"
                  >
                    Related Issue
                  </nuxt-link>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-10">
            <ModChannelRolesEditor />
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
