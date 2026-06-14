<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import { GET_CHANNEL_REPORTS } from '@/graphQLData/issue/queries';
import LockChannelDialog from '@/components/mod/LockChannelDialog.vue';
import UnlockChannelDialog from '@/components/mod/UnlockChannelDialog.vue';

const showOpenOnly = ref(true);

const { result, loading, error, refetch } = useQuery(
  GET_CHANNEL_REPORTS,
  () => ({
    isOpen: showOpenOnly.value ? true : null,
  }),
  {
    fetchPolicy: 'cache-and-network',
  }
);

const channelReports = computed(() => {
  return result.value?.issues || [];
});

const toggleFilter = () => {
  showOpenOnly.value = !showOpenOnly.value;
};

// Lock/Unlock dialog state
const showLockDialog = ref(false);
const showUnlockDialog = ref(false);
const selectedChannelUniqueName = ref('');

const openLockDialog = (channelUniqueName: string) => {
  selectedChannelUniqueName.value = channelUniqueName;
  showLockDialog.value = true;
};

const openUnlockDialog = (channelUniqueName: string) => {
  selectedChannelUniqueName.value = channelUniqueName;
  showUnlockDialog.value = true;
};

const handleLocked = () => {
  showLockDialog.value = false;
  refetch();
};

const handleUnlocked = () => {
  showUnlockDialog.value = false;
  refetch();
};
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">
          <input
            v-model="showOpenOnly"
            type="checkbox"
            class="mr-2 rounded"
            @change="toggleFilter"
          >
          Show open reports only
        </label>
      </div>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ channelReports.length }} report(s)
      </span>
    </div>

    <div v-if="loading" class="py-4 text-center text-gray-500">Loading...</div>

    <div v-else-if="error" class="rounded-md bg-red-50 p-4 text-red-600">
      {{ error.message }}
    </div>

    <div
      v-else-if="channelReports.length === 0"
      class="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      No channel reports found.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="report in channelReports"
        :key="report.id"
        class="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                #{{ report.issueNumber }}
              </span>
              <NuxtLink
                :to="`/forums/${report.relatedChannelUniqueName}`"
                class="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {{ report.relatedChannelUniqueName }}
              </NuxtLink>
              <span
                v-if="report.isOpen"
                class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Open
              </span>
              <span
                v-else
                class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                Closed
              </span>
              <span
                v-if="report.locked"
                class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              >
                <svg
                  class="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                Locked
              </span>
            </div>

            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ report.title }}
            </p>

            <div class="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Reported by
                <span class="font-medium">
                  {{
                    report.Author?.__typename === 'ModerationProfile'
                      ? `@${report.Author.displayName}`
                      : report.Author?.username || 'Unknown'
                  }}
                </span>
              </span>
              <span>
                {{
                  DateTime.fromISO(report.createdAt).toRelative()
                }}
              </span>
              <span v-if="report.ActivityFeedAggregate?.count > 0">
                {{ report.ActivityFeedAggregate.count }} report(s)
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <NuxtLink
              :to="`/admin/issues/${report.issueNumber}`"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              View
            </NuxtLink>
            <button
              v-if="!report.locked && report.relatedChannelUniqueName"
              class="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
              @click="openLockDialog(report.relatedChannelUniqueName)"
            >
              Lock
            </button>
            <button
              v-else-if="report.locked && report.relatedChannelUniqueName"
              class="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              @click="openUnlockDialog(report.relatedChannelUniqueName)"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>

    <LockChannelDialog
      v-if="selectedChannelUniqueName"
      :channel-unique-name="selectedChannelUniqueName"
      :open="showLockDialog"
      @close="showLockDialog = false"
      @locked="handleLocked"
    />

    <UnlockChannelDialog
      v-if="selectedChannelUniqueName"
      :channel-unique-name="selectedChannelUniqueName"
      :open="showUnlockDialog"
      @close="showUnlockDialog = false"
      @unlocked="handleUnlocked"
    />
  </div>
</template>
