<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import { config } from '@/config';
import { GET_SERVER_SUSPENDED_MODS } from '@/graphQLData/admin/queries';

const { result, loading, error } = useQuery(
  GET_SERVER_SUSPENDED_MODS,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const suspensions = computed(() => {
  return result.value?.serverConfigs?.[0]?.SuspendedMods ?? [];
});

const aggregateCount = computed(() => {
  return result.value?.serverConfigs?.[0]?.SuspendedModsAggregate?.count ?? 0;
});

const humanReadableDate = (dateISO?: string | null): string => {
  if (!dateISO) {
    return 'Unknown date';
  }

  return DateTime.fromISO(dateISO).toLocaleString(DateTime.DATETIME_MED);
};
</script>

<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <ErrorBanner v-else-if="error" :text="error.message" />
    <div
      v-else-if="
        result?.serverConfigs?.length === 0 ||
        result.serverConfigs[0]?.SuspendedMods?.length === 0
      "
      class="text-sm"
    >
      There are no active server-scoped mod suspensions.
    </div>

    <div v-if="suspensions.length > 0" class="flex-col text-sm">
      <div class="text-sm font-bold">
        {{ `Active Suspensions (${aggregateCount})` }}
      </div>
      <div
        v-for="suspension in suspensions"
        :key="suspension.id"
        class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div class="w-full flex-col">
          <div class="flex w-full justify-between gap-2">
            <nuxt-link
              :to="{
                name: 'mod-modId',
                params: { modId: suspension?.SuspendedMod?.displayName },
              }"
              class="flex items-center dark:text-white"
            >
              <AvatarComponent
                :text="suspension?.SuspendedMod?.displayName ?? ''"
                class="mr-2 h-6 w-6"
              />
              <span class="text-sm">{{
                `${suspension?.SuspendedMod?.displayName ?? suspension.modProfileName ?? ''} ${suspension?.username ? `(${suspension.username})` : ''}`
              }}</span>
            </nuxt-link>
            <nuxt-link
              v-if="suspension.RelatedIssue"
              class="items-center gap-1 rounded border border-orange-500 px-2 py-1 text-orange-500"
              :to="{
                name: 'admin-issues-issueNumber',
                params: { issueNumber: suspension.RelatedIssue.issueNumber },
              }"
            >
              Related Issue
            </nuxt-link>
          </div>

          <div
            v-if="!suspension.suspendedIndefinitely"
            class="text-sm text-gray-500 dark:text-gray-300"
          >
            {{
              `Suspended until ${humanReadableDate(suspension.suspendedUntil)}`
            }}
          </div>
          <div v-else class="text-sm text-gray-500 dark:text-gray-300">
            {{
              `Suspended indefinitely as of ${humanReadableDate(suspension.createdAt)}`
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
