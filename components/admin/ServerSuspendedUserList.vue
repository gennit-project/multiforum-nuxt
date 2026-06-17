<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import { config } from '@/config';
import { GET_SERVER_SUSPENDED_USERS } from '@/graphQLData/admin/queries';

const { result, loading, error } = useQuery(
  GET_SERVER_SUSPENDED_USERS,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const suspendedUsers = computed(() => {
  return result.value?.serverConfigs?.[0]?.SuspendedUsers ?? [];
});

const aggregateCount = computed(() => {
  return result.value?.serverConfigs?.[0]?.SuspendedUsersAggregate?.count ?? 0;
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
        result.serverConfigs[0]?.SuspendedUsers?.length === 0
      "
      class="text-sm"
    >
      There are no active server-scoped user suspensions.
    </div>

    <div
      v-if="suspendedUsers.length > 0"
      class="flex flex-col gap-2 text-sm dark:text-white"
    >
      <div class="text-sm font-bold">
        {{ `Active Suspensions (${aggregateCount})` }}
      </div>
      <div
        v-for="suspension in suspendedUsers"
        :key="suspension.id"
        class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div class="w-full flex-col">
          <div class="flex w-full justify-between gap-2">
            <nuxt-link
              :to="{
                name: 'u-username',
                params: {
                  username:
                    suspension.SuspendedUser?.username ?? suspension.username,
                },
              }"
              class="flex items-center font-bold dark:text-white"
            >
              <AvatarComponent
                :text="
                  suspension.SuspendedUser?.username ?? suspension.username ?? ''
                "
                :src="suspension.SuspendedUser?.profilePicURL ?? ''"
                class="mr-2 h-6 w-6"
              />
              <UsernameWithTooltip
                v-if="suspension.SuspendedUser?.username ?? suspension.username"
                :username="
                  suspension.SuspendedUser?.username ?? suspension.username ?? ''
                "
                :src="suspension.SuspendedUser?.profilePicURL ?? ''"
                :display-name="suspension.SuspendedUser?.displayName ?? ''"
                :comment-karma="suspension.SuspendedUser?.commentKarma ?? 0"
                :discussion-karma="suspension.SuspendedUser?.discussionKarma ?? 0"
                :account-created="suspension.SuspendedUser?.createdAt ?? ''"
              />
              <span
                v-if="suspension.SuspendedUser?.isBot"
                class="ml-2 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/70 dark:text-blue-100"
              >
                🤖 Bot
              </span>
            </nuxt-link>
            <nuxt-link
              v-if="suspension.RelatedIssue"
              class="flex items-center gap-1 rounded border border-orange-500 px-2 py-1 text-orange-500"
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
