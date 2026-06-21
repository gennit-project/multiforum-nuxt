<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import LockChannelDialog from '@/components/mod/LockChannelDialog.vue';
import UnlockChannelDialog from '@/components/mod/UnlockChannelDialog.vue';
import LockClosedIcon from '@/components/icons/LockClosedIcon.vue';
import LockOpenIcon from '@/components/icons/LockOpenIcon.vue';
import { DateTime } from 'luxon';
import { config } from '@/config';
import { useUsername, useModProfileName } from '@/composables/useAuthState';
import { checkPermission } from '@/utils/permissionUtils';

const usernameVar = useUsername();
const modProfileNameVar = useModProfileName();

const props = defineProps<{
  relatedChannelUniqueName: string;
}>();

// Fetch channel data to get lock state
const {
  result: channelResult,
  loading: channelLoading,
  refetch: refetchChannel,
} = useQuery(
  GET_CHANNEL,
  () => ({
    uniqueName: props.relatedChannelUniqueName,
    now: DateTime.local().startOf('hour').toISO(),
  }),
  {
    fetchPolicy: 'cache-and-network',
    enabled: !!props.relatedChannelUniqueName,
  }
);

const channel = computed(() => {
  return channelResult.value?.channels?.[0] ?? null;
});

// Server config for permissions
const { result: serverConfigResult } = useQuery(
  GET_SERVER_CONFIG,
  { serverName: config.serverName },
  { fetchPolicy: 'cache-first' }
);

const serverConfig = computed(() => {
  return serverConfigResult.value?.serverConfigs?.[0] ?? null;
});

// Check if current user has canLockChannel permission at server level
const canLockChannel = computed(() => {
  if (!serverConfig.value) return false;

  // Server admins can always lock
  const isServerAdmin = serverConfig.value.Admins?.some(
    (admin: { username: string }) => admin.username === usernameVar.value
  );
  if (isServerAdmin) return true;

  return checkPermission({
    permissionData: {
      Admins: serverConfig.value.Admins || [],
      Moderators: serverConfig.value.Moderators || [],
      SuspendedMods: [],
      SuspendedUsers: [],
    },
    standardModRole: serverConfig.value.DefaultModRole,
    elevatedModRole: serverConfig.value.DefaultElevatedModRole,
    username: usernameVar.value || '',
    modProfileName: modProfileNameVar.value || '',
    action: 'canLockChannel',
  });
});

// Dialog states
const showLockDialog = ref(false);
const showUnlockDialog = ref(false);

const handleLocked = () => {
  showLockDialog.value = false;
  refetchChannel();
};

const handleUnlocked = () => {
  showUnlockDialog.value = false;
  refetchChannel();
};
</script>

<template>
  <div
    v-if="relatedChannelUniqueName"
    class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Related Channel:
        </span>
        <NuxtLink
          :to="`/forums/${relatedChannelUniqueName}`"
          class="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {{ relatedChannelUniqueName }}
        </NuxtLink>

        <div v-if="channelLoading" class="text-sm text-gray-500">
          Loading...
        </div>

        <template v-else-if="channel">
          <span
            v-if="channel.locked"
            class="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <LockClosedIcon class="h-3 w-3" />
            Locked
          </span>
          <span
            v-else
            class="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            <LockOpenIcon class="h-3 w-3" />
            Active
          </span>
        </template>
      </div>

      <div v-if="canLockChannel && channel" class="flex gap-2">
        <button
          v-if="!channel.locked"
          class="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
          @click="showLockDialog = true"
        >
          Lock Channel
        </button>
        <button
          v-else
          class="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          @click="showUnlockDialog = true"
        >
          Unlock Channel
        </button>
      </div>
    </div>

    <!-- Lock details when locked -->
    <div
      v-if="channel?.locked"
      class="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">Locked by:</span>
        {{ channel.LockedBy?.displayName || 'Unknown' }}
      </p>
      <p v-if="channel.lockedAt" class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">Locked at:</span>
        {{ DateTime.fromISO(channel.lockedAt).toLocaleString(DateTime.DATETIME_MED) }}
      </p>
      <p v-if="channel.lockReason" class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">Reason:</span>
        {{ channel.lockReason }}
      </p>
    </div>

    <!-- Dialogs -->
    <LockChannelDialog
      :channel-unique-name="relatedChannelUniqueName"
      :channel-display-name="channel?.displayName || relatedChannelUniqueName"
      :open="showLockDialog"
      @close="showLockDialog = false"
      @locked="handleLocked"
    />

    <UnlockChannelDialog
      :channel-unique-name="relatedChannelUniqueName"
      :channel-display-name="channel?.displayName || relatedChannelUniqueName"
      :open="showUnlockDialog"
      @close="showUnlockDialog = false"
      @unlocked="handleUnlocked"
    />
  </div>
</template>
